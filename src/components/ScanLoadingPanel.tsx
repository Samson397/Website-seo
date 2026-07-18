"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScanProgressEvent } from "@/lib/types";

const FULL_STAGES = [
  { id: "fetch", label: "Fetching page", detail: "Loading the starting URL" },
  { id: "sitemap", label: "Reading sitemap", detail: "Discovering URLs from sitemap.xml" },
  { id: "crawl", label: "Crawling links", detail: "Following internal links across the site" },
  { id: "checks", label: "Running checks", detail: "SEO, security, speed & accessibility" },
  { id: "score", label: "Scoring results", detail: "Building your full scan report" },
] as const;

const FREE_STAGES = [
  { id: "fetch", label: "Fetching page", detail: "Loading the homepage" },
  { id: "checks", label: "Running checks", detail: "Scores, AI visibility & top issues" },
  { id: "score", label: "Building preview", detail: "Preparing your free brief" },
] as const;

function stageIndexFromId(stage: string, stages: readonly { id: string }[]): number {
  const i = stages.findIndex((s) => s.id === stage);
  if (i >= 0) return i;
  if (stage === "sitemap" || stage === "crawl") return Math.min(2, stages.length - 1);
  return 0;
}

interface ScanLoadingPanelProps {
  url?: string;
  /** Live events from /api/audit/stream */
  events?: ScanProgressEvent[];
  /** Free homepage preview vs full-site crawl */
  mode?: "free" | "full";
}

export function ScanLoadingPanel({ url, events = [], mode = "full" }: ScanLoadingPanelProps) {
  const [elapsed, setElapsed] = useState(0);
  const stages = mode === "free" ? FREE_STAGES : FULL_STAGES;

  const host = useMemo(() => {
    if (!url) return "your site";
    try {
      const raw = url.includes("://") ? url : `https://${url}`;
      return new URL(raw).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }, [url]);

  useEffect(() => {
    setElapsed(0);
    const started = Date.now();
    const tick = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [url]);

  const stageEvent = [...events].reverse().find((e) => e.type === "stage");
  const crawlEvent = [...events].reverse().find((e) => e.type === "crawl");

  let stageIndex = 0;
  if (stageEvent && stageEvent.type === "stage") {
    stageIndex = stageIndexFromId(stageEvent.stage, stages);
    if (mode === "full" && crawlEvent && crawlEvent.type === "crawl" && crawlEvent.scanned > 0) {
      stageIndex = Math.max(stageIndex, stageIndexFromId("crawl", stages));
    }
  } else if (crawlEvent && mode === "full") {
    stageIndex = stageIndexFromId("crawl", stages);
  }

  const activityLines: string[] = [];
  for (const e of events) {
    if (e.type === "stage") activityLines.push(e.message);
    if (e.type === "crawl") {
      activityLines.push(
        e.lastPath
          ? `Scanned ${e.scanned} · queued ${e.queued} · ${e.lastPath}`
          : `Scanned ${e.scanned} · queued ${e.queued}`
      );
    }
  }
  if (activityLines.length === 0) {
    activityLines.push(
      "Connecting…",
      mode === "free" ? "Starting homepage preview…" : "Starting full-site scan…"
    );
  }
  const visibleActivity = activityLines.slice(-3);

  const crawlScanned = crawlEvent && crawlEvent.type === "crawl" ? crawlEvent.scanned : 0;
  const progress =
    stageIndex >= stages.length - 1
      ? 92
      : mode === "full" && stageIndex === 3
        ? 70 + Math.min(20, crawlScanned)
        : ((stageIndex + 1) / stages.length) * 100;

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-glow">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
        <div className="scan-grid absolute inset-0" />
        <div className="scan-radar absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full" />
      </div>

      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
              {mode === "free" ? "Free preview" : "Full site scan"}
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              Scanning {host}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {mode === "free"
                ? "Homepage scores, AI visibility, and top issues — usually under 30 seconds."
                : "Discovering pages, then checking each one. Large sites may take up to a minute."}
            </p>
            <p className="mt-3 font-mono text-xs text-ink-muted/80">
              {elapsed}s elapsed
              {crawlScanned > 0 ? ` · ${crawlScanned} pages so far` : ""}
            </p>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
              <span>{stages[stageIndex]?.label}</span>
              <span>{Math.round(Math.min(progress, 98))}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-teal transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(progress, 98)}%` }}
              />
            </div>
          </div>
        </div>

        <ol
          className={`mt-8 grid gap-2 ${mode === "free" ? "sm:grid-cols-3" : "sm:grid-cols-5"}`}
        >
          {stages.map((stage, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            return (
              <li
                key={stage.id}
                className={`rounded-xl px-3 py-3 ring-1 transition ${
                  active
                    ? "bg-teal-soft/60 ring-teal/40"
                    : done
                      ? "bg-paper ring-ink/5"
                      : "bg-white ring-ink/5 opacity-55"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      active
                        ? "scan-pulse relative bg-teal text-white"
                        : done
                          ? "bg-teal text-white"
                          : "bg-mist text-ink-muted"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`text-xs font-semibold ${active ? "text-teal" : "text-ink"}`}>
                    {stage.label}
                  </span>
                </div>
                <p className="mt-1.5 pl-7 text-[11px] leading-snug text-ink-muted">{stage.detail}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 rounded-xl border border-ink/5 bg-ink/[0.02] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Live activity
          </p>
          <ul className="mt-2 space-y-1.5 font-mono text-xs sm:text-sm">
            {visibleActivity.map((line, idx) => {
              const newest = idx === visibleActivity.length - 1;
              return (
                <li
                  key={`${line}-${idx}-${activityLines.length}`}
                  className={`scan-activity-line ${newest ? "text-ink" : "text-ink-muted/55"}`}
                >
                  <span className={newest ? "text-teal" : "text-ink-muted/40"}>›</span> {line}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

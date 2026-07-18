"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScanProgressEvent } from "@/lib/types";

const FULL_STAGES = [
  { id: "fetch", label: "Fetching page" },
  { id: "sitemap", label: "Reading sitemap" },
  { id: "crawl", label: "Crawling links" },
  { id: "checks", label: "Running checks" },
  { id: "score", label: "Scoring results" },
] as const;

const FREE_STAGES = [
  { id: "fetch", label: "Fetching page" },
  { id: "checks", label: "Running checks" },
  { id: "score", label: "Building preview" },
] as const;

function stageIndexFromId(stage: string, stages: readonly { id: string }[]): number {
  const i = stages.findIndex((s) => s.id === stage);
  if (i >= 0) return i;
  if (stage === "sitemap" || stage === "crawl") return Math.min(2, stages.length - 1);
  return 0;
}

interface ScanLoadingPanelProps {
  url?: string;
  events?: ScanProgressEvent[];
  mode?: "free" | "full";
}

/** Centered popup overlay while a scan runs. */
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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
  const latest = activityLines[activityLines.length - 1];

  const crawlScanned = crawlEvent && crawlEvent.type === "crawl" ? crawlEvent.scanned : 0;
  const progress =
    stageIndex >= stages.length - 1
      ? 92
      : mode === "full" && stageIndex === 3
        ? 70 + Math.min(20, crawlScanned)
        : ((stageIndex + 1) / stages.length) * 100;

  return (
    <div
      className="scan-modal-root fixed inset-0 z-[80] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
      aria-busy="true"
    >
      <div className="scan-modal-backdrop absolute inset-0 bg-ink/45 backdrop-blur-md" aria-hidden />

      <div className="scan-modal-card relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-paper shadow-glow">
        <div className="scan-sheen absolute inset-x-0 top-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
          <div className="scan-grid absolute inset-0" />
        </div>

        <div className="relative px-6 py-8 text-center sm:px-8">
          <div className="scan-orbit mx-auto mb-5" aria-hidden>
            <span className="scan-orbit-ring" />
            <span className="scan-orbit-ring scan-orbit-ring-delay" />
            <span className="scan-orbit-core" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            {mode === "free" ? "Free preview" : "Full site scan"}
          </p>
          <h2
            id="scan-modal-title"
            className="font-display mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            Scanning {host}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {mode === "free"
              ? "Homepage scores & AI visibility — usually under 30 seconds."
              : "Crawling pages and running checks. Large sites can take up to a minute."}
          </p>

          <div className="mx-auto mt-6 max-w-sm text-left">
            <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
              <span>{stages[stageIndex]?.label}</span>
              <span>{Math.round(Math.min(progress, 98))}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-mist">
              <div
                className="scan-progress-fill h-full rounded-full bg-teal transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(progress, 98)}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-xs text-ink-muted/80">
              {elapsed}s elapsed
              {crawlScanned > 0 ? ` · ${crawlScanned} pages` : ""}
            </p>
          </div>

          <ol className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-2">
            {stages.map((stage, i) => {
              const done = i < stageIndex;
              const active = i === stageIndex;
              return (
                <li
                  key={stage.id}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    active
                      ? "bg-teal text-white shadow-glow"
                      : done
                        ? "bg-teal-soft text-teal"
                        : "bg-mist text-ink-muted"
                  }`}
                >
                  {done ? "✓ " : ""}
                  {stage.label}
                </li>
              );
            })}
          </ol>

          <p
            key={`${latest}-${activityLines.length}`}
            className="scan-activity-line mx-auto mt-6 max-w-sm truncate font-mono text-xs text-ink-muted"
          >
            <span className="text-teal">›</span> {latest}
          </p>
        </div>
      </div>
    </div>
  );
}

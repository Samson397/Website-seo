"use client";

import { useEffect, useMemo, useState } from "react";

const STAGES = [
  { id: "fetch", label: "Fetching page", detail: "Loading the starting URL" },
  { id: "sitemap", label: "Reading sitemap", detail: "Discovering URLs from sitemap.xml" },
  { id: "crawl", label: "Crawling links", detail: "Following internal links across the site" },
  { id: "checks", label: "Running checks", detail: "SEO, security, speed & accessibility" },
  { id: "score", label: "Scoring results", detail: "Building your full scan report" },
] as const;

/** Rough dwell times — crawl + checks are the long parts of a full-site scan. */
const STAGE_MS = [4500, 6000, 14000, 16000, 12000];

const ACTIVITY_LINES = [
  "Resolving DNS & TLS…",
  "Fetching homepage HTML…",
  "Opening /robots.txt…",
  "Parsing sitemap.xml…",
  "Found nested sitemap index…",
  "Queued /about for scan…",
  "Queued /pricing for scan…",
  "Queued /blog for scan…",
  "Checking page titles…",
  "Checking meta descriptions…",
  "Looking for duplicate titles…",
  "Verifying HTTPS & HSTS…",
  "Inspecting security headers…",
  "Counting heading structure…",
  "Checking image alt text…",
  "Measuring server response…",
  "Scanning Open Graph tags…",
  "Validating structured data…",
  "Building score summary…",
];

interface ScanLoadingPanelProps {
  url?: string;
}

export function ScanLoadingPanel({ url }: ScanLoadingPanelProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

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
    setStageIndex(0);
    setActivityIndex(0);
    setElapsed(0);

    const started = Date.now();
    const tick = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    let stage = 0;
    let cancelled = false;
    let timer: number | undefined;

    const advance = () => {
      if (cancelled) return;
      const wait = STAGE_MS[Math.min(stage, STAGE_MS.length - 1)];
      timer = window.setTimeout(() => {
        stage = Math.min(stage + 1, STAGES.length - 1);
        setStageIndex(stage);
        if (stage < STAGES.length - 1) advance();
      }, wait);
    };
    advance();

    const activity = window.setInterval(() => {
      setActivityIndex((i) => (i + 1) % ACTIVITY_LINES.length);
    }, 1800);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      window.clearInterval(activity);
      if (timer) window.clearTimeout(timer);
    };
  }, [url]);

  const visibleActivity = [
    ACTIVITY_LINES[(activityIndex + ACTIVITY_LINES.length - 2) % ACTIVITY_LINES.length],
    ACTIVITY_LINES[(activityIndex + ACTIVITY_LINES.length - 1) % ACTIVITY_LINES.length],
    ACTIVITY_LINES[activityIndex],
  ];

  const progress = ((stageIndex + 1) / STAGES.length) * 100;

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      {/* Subtle sitemap grid + radar */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
        <div className="scan-grid absolute inset-0" />
        <div className="scan-radar absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full" />
      </div>

      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
              Full site scan
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              Scanning {host}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Discovering pages, then checking each one. Large sites may take up to a minute.
            </p>
            <p className="mt-3 font-mono text-xs text-ink-muted/80">{elapsed}s elapsed</p>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
              <span>{STAGES[stageIndex].label}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-teal transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stage timeline */}
        <ol className="mt-8 grid gap-2 sm:grid-cols-5">
          {STAGES.map((stage, i) => {
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
                  <span
                    className={`text-xs font-semibold ${active ? "text-teal" : "text-ink"}`}
                  >
                    {stage.label}
                  </span>
                </div>
                <p className="mt-1.5 pl-7 text-[11px] leading-snug text-ink-muted">
                  {stage.detail}
                </p>
              </li>
            );
          })}
        </ol>

        {/* Live activity feed */}
        <div className="mt-8 rounded-xl border border-ink/5 bg-ink/[0.02] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Live activity
          </p>
          <ul className="mt-2 space-y-1.5 font-mono text-xs sm:text-sm">
            {visibleActivity.map((line, idx) => {
              const newest = idx === visibleActivity.length - 1;
              return (
                <li
                  key={`${line}-${activityIndex}-${idx}`}
                  className={`scan-activity-line ${
                    newest ? "text-ink" : "text-ink-muted/55"
                  }`}
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

"use client";

import type { HistoryEntry } from "@/lib/local-history";

interface ScoreHistoryChartProps {
  entries: HistoryEntry[];
  hostname?: string;
}

/** SVG score-over-time chart from local scan history (newest-first entries). */
export function ScoreHistoryChart({ entries, hostname }: ScoreHistoryChartProps) {
  const points = (hostname
    ? entries.filter((e) => e.hostname === hostname)
    : entries
  )
    .slice()
    .reverse(); // oldest → newest for the line

  if (points.length < 2) {
    return (
      <p className="text-sm text-ink-muted">
        Re-scan this site at least twice to unlock a score history chart.
      </p>
    );
  }

  const w = 320;
  const h = 96;
  const padX = 8;
  const padY = 10;
  const scores = points.map((p) => p.overall);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = Math.max(1, max - min);

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (w - padX * 2);
    const y = h - padY - ((p.overall - min) / range) * (h - padY * 2);
    return { x, y, p };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const first = points[0];
  const latest = points[points.length - 1];
  const delta = latest.overall - first.overall;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
            Progress
          </p>
          <h3 className="font-display mt-1 text-lg font-semibold text-ink">
            SEO score over time
            {hostname ? ` · ${hostname}` : ""}
          </h3>
        </div>
        <p className="text-sm text-ink-muted">
          {points.length} scans ·{" "}
          <span className={delta >= 0 ? "font-semibold text-teal" : "font-semibold text-rose-600"}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>{" "}
          vs first
        </p>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        className="mt-4 overflow-visible text-teal"
        role="img"
        aria-label={`Score history from ${first.overall} to ${latest.overall}`}
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {coords.map((c) => (
          <circle key={c.p.scannedAt} cx={c.x} cy={c.y} r="3.5" fill="currentColor" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
        <span>{new Date(first.scannedAt).toLocaleDateString()}</span>
        <span>{new Date(latest.scannedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

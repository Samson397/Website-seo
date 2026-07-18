"use client";

import type { KeywordHistoryPoint } from "@/lib/local-keywords";

interface RankHistoryChartProps {
  history?: KeywordHistoryPoint[];
}

/** Simple SVG sparkline of on-page scores over time. */
export function RankHistoryChart({ history }: RankHistoryChartProps) {
  if (!history || history.length < 2) {
    return (
      <p className="mt-2 text-xs text-ink-muted">
        Check rank at least twice to see a local history chart.
      </p>
    );
  }

  const w = 160;
  const h = 36;
  const pad = 2;
  const scores = history.map((p) => p.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = Math.max(1, max - min);

  const points = history
    .map((p, i) => {
      const x = pad + (i / (history.length - 1)) * (w - pad * 2);
      const y = h - pad - ((p.score - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const latest = history[history.length - 1];
  const first = history[0];
  const delta = latest.score - first.score;

  return (
    <div className="mt-2 flex items-center gap-3">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-teal"
          points={points}
        />
      </svg>
      <div className="text-xs text-ink-muted">
        <p>
          {history.length} checks ·{" "}
          <span className={delta >= 0 ? "text-teal" : "text-rose-600"}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>{" "}
          vs first
        </p>
        {latest.serpPosition != null ? <p>Last SERP #{latest.serpPosition}</p> : null}
      </div>
    </div>
  );
}

"use client";

import type { AuditReport, AuditScores } from "@/lib/types";

interface ScoreComparisonProps {
  previous: AuditReport;
  current: AuditReport;
}

function ScoreDelta({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  const color =
    delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-slate-500";
  const sign = delta > 0 ? "+" : "";

  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="text-sm text-slate-400">{before}</span>
        <span className="text-slate-300">→</span>
        <span className="text-lg font-bold text-slate-900">{after}</span>
        <span className={`text-sm font-semibold ${color}`}>
          ({sign}{delta})
        </span>
      </div>
    </div>
  );
}

export function ScoreComparison({ previous, current }: ScoreComparisonProps) {
  const categories: { key: keyof AuditScores; label: string }[] = [
    { key: "seo", label: "SEO" },
    { key: "performance", label: "Performance" },
    { key: "accessibility", label: "Accessibility" },
    { key: "security", label: "Security" },
  ];

  const issueDelta = current.summary.critical - previous.summary.critical;

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
      <h3 className="font-semibold text-green-900">Re-scan Comparison</h3>
      <p className="mt-1 text-sm text-green-700">
        Compared to scan at {new Date(previous.scannedAt).toLocaleString()}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map(({ key, label }) => (
          <ScoreDelta
            key={key}
            label={label}
            before={previous.scores[key]}
            after={current.scores[key]}
          />
        ))}
      </div>
      <p className="mt-3 text-sm text-green-800">
        Critical issues: {previous.summary.critical} → {current.summary.critical}
        {issueDelta !== 0 && (
          <span className={issueDelta < 0 ? " font-semibold text-green-600" : " font-semibold text-red-600"}>
            {" "}({issueDelta > 0 ? "+" : ""}{issueDelta})
          </span>
        )}
      </p>
    </div>
  );
}

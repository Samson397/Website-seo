"use client";

import type { CompetitorAuditResult } from "@/lib/competitor-scores";
import { buildCompetitorGapRows } from "@/lib/competitor-gap";
import { formatUrlDisplay } from "@/lib/url-display";
import { formatTenLabel } from "@/lib/score-display";

interface CompetitorGapPanelProps {
  results: CompetitorAuditResult[];
}

export function CompetitorGapPanel({ results }: CompetitorGapPanelProps) {
  const rows = buildCompetitorGapRows(results);
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/5 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Gap lite</p>
        <h3 className="font-display mt-1 text-xl font-semibold text-ink">
          Titles, content length & top issues
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Side-by-side snapshot of on-page SEO signals and the highest-severity findings.
        </p>
      </div>

      <div className="overflow-x-auto px-2 sm:px-4">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-3 font-medium">Site</th>
              <th className="px-3 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Desc len</th>
              <th className="px-3 py-3 font-medium">H1 / title</th>
              <th className="px-3 py-3 font-medium">Words</th>
              <th className="px-3 py-3 font-medium">Top issues</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.url} className="border-b border-ink/5 align-top last:border-0">
                <td className="px-3 py-3">
                  <div className="font-medium text-ink">{row.label}</div>
                  <div className="text-xs text-ink-muted">{formatUrlDisplay(row.url)}</div>
                  {row.overall != null ? (
                    <div className="mt-1 text-xs text-teal">Overall {row.overall}</div>
                  ) : (
                    <div className="mt-1 text-xs text-rose-600">{row.error}</div>
                  )}
                </td>
                <td className="max-w-[200px] px-3 py-3">
                  <p className="truncate text-ink" title={row.title}>
                    {row.title}
                  </p>
                  <p className="text-xs text-ink-muted">{row.titleLen} chars</p>
                </td>
                <td className="px-3 py-3 tabular-nums text-ink-muted">{row.descriptionLen}</td>
                <td className="max-w-[180px] truncate px-3 py-3 text-ink-muted" title={row.h1}>
                  {row.h1}
                </td>
                <td className="px-3 py-3 tabular-nums text-ink-muted">
                  {row.wordCount != null ? row.wordCount : "—"}
                </td>
                <td className="px-3 py-3">
                  {row.topIssues.length === 0 ? (
                    <span className="text-xs text-ink-muted">—</span>
                  ) : (
                    <ul className="space-y-1">
                      {row.topIssues.map((issue, i) => (
                        <li key={`${row.url}-${i}`} className="text-xs text-ink-muted">
                          <span
                            className={
                              issue.severity === "critical"
                                ? "font-semibold text-rose-700"
                                : issue.severity === "warning"
                                  ? "font-semibold text-amber-800"
                                  : "font-semibold text-teal"
                            }
                          >
                            {issue.severity}
                          </span>{" "}
                          {issue.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

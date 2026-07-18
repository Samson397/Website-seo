"use client";

import { useState } from "react";
import type { CompetitorAuditResult } from "@/lib/competitor-scores";
import { checklistPassRate, overallScore, rankCompetitorResults } from "@/lib/competitor-scores";
import { formatUrlDisplay } from "@/lib/url-display";
import { formatTen } from "@/lib/score-display";
import { AuditReportView } from "@/components/AuditReport";
import { ChecksPanel } from "@/components/ChecksPanel";
import { CompetitorGapPanel } from "@/components/CompetitorGapPanel";

interface CompetitorComparisonPanelProps {
  results: CompetitorAuditResult[];
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

export function CompetitorComparisonPanel({ results }: CompetitorComparisonPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const ranked = rankCompetitorResults(results);
  const successful = ranked.filter((r) => r.report);
  const failed = ranked.filter((r) => r.error);

  return (
    <div className="space-y-8">
      <CompetitorGapPanel results={results} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Competitor comparison</h2>
        <p className="mt-1 text-sm text-slate-500">
          {successful.length} of {results.length} sites audited successfully
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4">Rank</th>
                <th className="pb-3 pr-4">Site</th>
                <th className="pb-3 pr-4 text-center">Overall/10</th>
                <th className="pb-3 pr-4 text-center">SEO</th>
                <th className="pb-3 pr-4 text-center">Perf</th>
                <th className="pb-3 pr-4 text-center">A11y</th>
                <th className="pb-3 pr-4 text-center">Security</th>
                <th className="pb-3 pr-4 text-center">AI</th>
                <th className="pb-3 pr-4 text-center">Critical</th>
                <th className="pb-3 text-center">Checklist</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((result, index) => {
                if (result.error) {
                  return (
                    <tr key={result.url} className="border-b border-slate-100 text-slate-500">
                      <td className="py-3 pr-4">—</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-700">{result.label}</div>
                        <div className="text-xs text-red-600">{result.error}</div>
                      </td>
                      <td colSpan={8} className="py-3 text-center text-red-500">
                        Failed
                      </td>
                    </tr>
                  );
                }

                const report = result.report!;
                const overall = overallScore(report);
                const checklist = checklistPassRate(report);

                return (
                  <tr
                    key={result.url}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-400">{index + 1}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIndex(expandedIndex === index ? null : index)
                        }
                        className="text-left font-medium text-blue-600 hover:underline"
                      >
                        {formatUrlDisplay(report.url)}
                      </button>
                    </td>
                    <td className={`py-3 pr-4 text-center font-bold ${scoreColor(overall)}`}>
                      {formatTen(overall)}
                    </td>
                    <td className="py-3 pr-4 text-center">{formatTen(report.scores.seo)}</td>
                    <td className="py-3 pr-4 text-center">{formatTen(report.scores.performance)}</td>
                    <td className="py-3 pr-4 text-center">{formatTen(report.scores.accessibility)}</td>
                    <td className="py-3 pr-4 text-center">{formatTen(report.scores.security)}</td>
                    <td className="py-3 pr-4 text-center">{formatTen(report.scores.ai ?? 0)}</td>
                    <td className="py-3 pr-4 text-center">
                      {report.summary.critical > 0 ? (
                        <span className="font-semibold text-red-600">
                          {report.summary.critical}
                        </span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {checklist !== null ? `${checklist}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {expandedIndex !== null && ranked[expandedIndex]?.report && (
        <div className="rounded-2xl border border-blue-200 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">
              Full report: {formatUrlDisplay(ranked[expandedIndex].report!.url)}
            </h3>
            <button
              type="button"
              onClick={() => setExpandedIndex(null)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <div className="p-4 space-y-8">
            {ranked[expandedIndex].report!.checklist && (
              <ChecksPanel checklist={ranked[expandedIndex].report!.checklist!} />
            )}
            <AuditReportView report={ranked[expandedIndex].report!} />
          </div>
        </div>
      )}

      {failed.length > 0 && (
        <p className="text-sm text-slate-500">
          {failed.length} site{failed.length > 1 ? "s" : ""} could not be audited. Check the URL
          is public and reachable.
        </p>
      )}
    </div>
  );
}

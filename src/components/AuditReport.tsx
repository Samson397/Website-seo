"use client";

import { useState } from "react";
import type { AuditReport, AuditCategory } from "@/lib/types";
import { ScoreGauge } from "@/components/ScoreGauge";
import { IssueCard } from "@/components/IssueCard";

interface AuditReportViewProps {
  report: AuditReport;
}

const CATEGORIES: { key: AuditCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "seo", label: "SEO" },
  { key: "performance", label: "Performance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "security", label: "Security" },
  { key: "links", label: "Links" },
];

export function AuditReportView({ report }: AuditReportViewProps) {
  const [filter, setFilter] = useState<AuditCategory | "all">("all");

  const filteredIssues =
    filter === "all"
      ? report.issues
      : report.issues.filter((i) => i.category === filter);

  const perfSkipped = !!report.performanceNote;

  return (
    <div className="mt-10 space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Audit Results</h2>
            <p className="mt-1 break-all text-sm text-slate-500">{report.url}</p>
            <p className="text-xs text-slate-400">
              Scanned {new Date(report.scannedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
              {report.summary.critical} critical
            </span>
            <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-700">
              {report.summary.warning} warnings
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
              {report.summary.info} info
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <ScoreGauge label="SEO" score={report.scores.seo} />
          <ScoreGauge label="Performance" score={report.scores.performance} skipped={perfSkipped} />
          <ScoreGauge label="Accessibility" score={report.scores.accessibility} />
          <ScoreGauge label="Security" score={report.scores.security} />
        </div>

        {report.performanceMetrics && (
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-5">
            {report.performanceMetrics.lcp && (
              <Metric label="LCP" value={report.performanceMetrics.lcp} />
            )}
            {report.performanceMetrics.cls && (
              <Metric label="CLS" value={report.performanceMetrics.cls} />
            )}
            {report.performanceMetrics.inp && (
              <Metric label="INP" value={report.performanceMetrics.inp} />
            )}
            {report.performanceMetrics.fcp && (
              <Metric label="FCP" value={report.performanceMetrics.fcp} />
            )}
            {report.performanceMetrics.ttfb && (
              <Metric label="TTFB" value={report.performanceMetrics.ttfb} />
            )}
          </div>
        )}

        {report.performanceNote && (
          <p className="mt-4 text-sm text-slate-500">{report.performanceNote}</p>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === cat.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
              {cat.key !== "all" && (
                <span className="ml-1 opacity-70">
                  ({report.issues.filter((i) => i.category === cat.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredIssues.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
            <p className="text-lg font-semibold text-green-800">No issues found!</p>
            <p className="mt-1 text-sm text-green-600">
              This category looks good for the scanned page.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

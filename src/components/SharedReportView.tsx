"use client";

import { useState } from "react";
import type { AuditCategory, AuditReport } from "@/lib/types";
import { formatUrlDisplay } from "@/lib/url-display";
import { ProblemsSummary } from "@/components/ProblemsSummary";
import { ChecksPanel } from "@/components/ChecksPanel";
import { AuditReportView } from "@/components/AuditReport";
import { BenchmarkCompare } from "@/components/BenchmarkCompare";
import { ExportButtons } from "@/components/ExportButtons";
import { ScoreGauge } from "@/components/ScoreGauge";

export function SharedReportView({
  report,
  shareId,
}: {
  report: AuditReport;
  shareId: string;
}) {
  const [issueFilter, setIssueFilter] = useState<AuditCategory | "all">("all");
  const overall = Math.round(
    (report.scores.seo +
      report.scores.performance +
      report.scores.accessibility +
      report.scores.security) /
      4
  );

  return (
    <div className="mt-8 space-y-8 pb-12">
      <section className="report-shell animate-rise overflow-hidden rounded-3xl">
        <div className="grid gap-6 bg-gradient-to-br from-ink via-brand-deep to-brand px-6 py-8 text-white sm:grid-cols-[1fr_auto] sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
              Shared SEOHub report
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {formatUrlDisplay(report.url)}
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Read-only snapshot · Scanned {new Date(report.scannedAt).toLocaleString()}
            </p>
            <p className="mt-4 font-mono text-xs text-white/45">Share ID {shareId}</p>
            <div className="mt-5">
              <ExportButtons report={{ ...report, shareId }} />
            </div>
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-white/10 px-6 py-4 backdrop-blur">
            <div className="text-center">
              <ScoreGauge label="Overall" score={overall} size="lg" />
            </div>
          </div>
        </div>
      </section>

      <BenchmarkCompare report={report} />
      <ProblemsSummary
        report={report}
        onJumpToCategory={(category) => {
          setIssueFilter(category);
          document.getElementById("audit-issues")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      {report.checklist && <ChecksPanel checklist={report.checklist} />}
      <AuditReportView
        report={report}
        showProblemsSummary={false}
        categoryFilter={issueFilter}
        onCategoryFilterChange={setIssueFilter}
      />
    </div>
  );
}

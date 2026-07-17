"use client";

import { useState } from "react";
import type { AuditCategory, AuditReport } from "@/lib/types";
import { ProblemsSummary } from "@/components/ProblemsSummary";
import { ChecksPanel } from "@/components/ChecksPanel";
import { AuditReportView } from "@/components/AuditReport";
import { BenchmarkCompare } from "@/components/BenchmarkCompare";
import { ExportButtons } from "@/components/ExportButtons";

export function SharedReportView({
  report,
  shareId,
}: {
  report: AuditReport;
  shareId: string;
}) {
  const [issueFilter, setIssueFilter] = useState<AuditCategory | "all">("all");

  return (
    <div className="mt-8 space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-4">
        <p className="text-sm text-ink-muted">
          Share ID <span className="font-mono text-ink">{shareId}</span>
        </p>
        <ExportButtons report={{ ...report, shareId }} />
      </div>
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

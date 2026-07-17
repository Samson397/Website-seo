import type { AuditIssue, AuditReport, SiteChecklist } from "@/lib/types";

const FREE_ISSUE_TEASER_COUNT = 3;

/** Strip paid-only detail so free API responses cannot leak the full report. */
export function toFreePreviewReport(report: AuditReport): AuditReport {
  const teaserIssues: AuditIssue[] = report.issues.slice(0, FREE_ISSUE_TEASER_COUNT).map((issue) => ({
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    description: "Unlock the full report to see the diagnosis and fix.",
    recommendation: "Pay once to unlock full issue details, checklist, crawl, and exports.",
  }));

  return {
    url: report.url,
    scannedAt: report.scannedAt,
    scores: report.scores,
    summary: report.summary,
    serpPreview: report.serpPreview,
    issues: teaserIssues,
    checklist: summarizeChecklist(report.checklist),
    crawl: undefined,
    siteOverview: undefined,
    performanceMetrics: undefined,
    shareId: undefined,
    tier: "free",
  };
}

function summarizeChecklist(checklist: SiteChecklist | undefined): SiteChecklist | undefined {
  if (!checklist) return undefined;
  const pass = checklist.passCount ?? checklist.hasCount ?? 0;
  const fail = checklist.failCount ?? checklist.missingCount ?? 0;
  const attention = checklist.attentionCount ?? checklist.warningCount ?? 0;
  return {
    items: [],
    passCount: pass,
    failCount: fail,
    attentionCount: attention,
    hasCount: pass,
    missingCount: fail,
    warningCount: attention,
    summary: `${pass} passed · ${fail} failed · ${attention} need review — unlock for the full checklist.`,
  };
}

export function isPaidReport(report: AuditReport | null | undefined): boolean {
  return report?.tier === "full";
}

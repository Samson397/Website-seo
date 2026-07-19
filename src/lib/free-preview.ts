import type { AuditIssue, AuditReport, SiteChecklist } from "@/lib/types";

const FREE_ISSUE_TEASER_COUNT = 3;
const COMPARE_ISSUE_TITLE_COUNT = 8;

/** Strip paid-only detail so free API responses cannot leak the full report. */
export function toFreePreviewReport(report: AuditReport): AuditReport {
  const teaserIssues: AuditIssue[] = report.issues.slice(0, FREE_ISSUE_TEASER_COUNT).map((issue) => ({
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    description: "Unlock the full report to see the diagnosis and fix.",
    recommendation:
      "Pay for one full-site scan to unlock issue details, checklist, crawl, and exports.",
  }));

  return {
    url: report.url,
    scannedAt: report.scannedAt,
    scores: report.scores,
    summary: report.summary,
    serpPreview: report.serpPreview,
    issues: teaserIssues,
    checklist: summarizeChecklist(report.checklist),
    // AI visibility teaser stays visible — key free differentiator
    aiVisibility: report.aiVisibility,
    crawl: undefined,
    siteOverview: undefined,
    performanceMetrics: undefined,
    shareId: undefined,
    // Keep stash id so checkout can unlock this report without a re-crawl
    previewId: report.previewId,
    tier: "free",
  };
}

/**
 * Homepage competitor compare: scores + issue titles + checklist statuses,
 * without full diagnosis text or a paid unlock.
 */
export function toCompetitorCompareReport(report: AuditReport): AuditReport {
  const titleIssues: AuditIssue[] = report.issues
    .slice(0, COMPARE_ISSUE_TITLE_COUNT)
    .map((issue) => ({
      id: issue.id,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: "Homepage compare — open a full SEOHub scan for diagnosis and fixes.",
      recommendation: "Run a free homepage preview or unlock a full-site crawl on your own URL.",
      currentValue: issue.currentValue,
    }));

  const items = (report.checklist?.items || []).map((item) => ({
    id: item.id,
    label: item.label,
    status: item.status,
    category: item.category,
    explanation: item.status === "pass" ? "Pass" : "Needs attention",
  }));

  const pass = report.checklist?.passCount ?? report.checklist?.hasCount ?? 0;
  const fail = report.checklist?.failCount ?? report.checklist?.missingCount ?? 0;
  const attention = report.checklist?.attentionCount ?? report.checklist?.warningCount ?? 0;

  return {
    url: report.url,
    scannedAt: report.scannedAt,
    scores: report.scores,
    summary: report.summary,
    serpPreview: report.serpPreview,
    issues: titleIssues,
    checklist: {
      items,
      passCount: pass,
      failCount: fail,
      attentionCount: attention,
      hasCount: pass,
      missingCount: fail,
      warningCount: attention,
      summary: `${pass} passed · ${fail} failed · ${attention} need review`,
    },
    aiVisibility: report.aiVisibility,
    siteOverview: report.siteOverview,
    crawl: undefined,
    performanceMetrics: undefined,
    shareId: undefined,
    previewId: undefined,
    tier: "compare",
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

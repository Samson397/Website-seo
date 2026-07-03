import type { AuditReport } from "@/lib/types";
import { prisma } from "@/lib/db";
import { compareReports } from "@/lib/compare-reports";

export const MAX_PROJECTS_PER_USER = 3;

export function parseStoredReport(report: unknown): AuditReport | undefined {
  if (!report || typeof report !== "object") {
    return undefined;
  }
  return report as AuditReport;
}

export function extractScanMetrics(report: AuditReport) {
  return {
    seoScore: report.scores.seo,
    performanceScore: report.scores.performance,
    accessibilityScore: report.scores.accessibility,
    securityScore: report.scores.security,
    criticalCount: report.summary.critical,
    warningCount: report.summary.warning,
    infoCount: report.summary.info,
  };
}

export async function saveScan(
  projectId: string,
  report: AuditReport,
  trigger: "manual" | "scheduled" = "manual"
) {
  const metrics = extractScanMetrics(report);

  const scan = await prisma.scan.create({
    data: {
      projectId,
      trigger,
      report: report as object,
      ...metrics,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { lastScanAt: scan.createdAt },
  });

  return scan;
}

export interface ScanAlert {
  type: "critical_increase" | "score_drop" | "new_critical_issues" | "issues_fixed" | "checklist_change";
  message: string;
}

export function compareScans(previous: AuditReport, current: AuditReport): ScanAlert[] {
  const alerts: ScanAlert[] = [];
  const comparison = compareReports(previous, current);

  if (comparison.newIssues.filter((i) => i.severity === "critical").length > 0) {
    const count = comparison.newIssues.filter((i) => i.severity === "critical").length;
    alerts.push({
      type: "new_critical_issues",
      message: `${count} new critical issue${count === 1 ? "" : "s"}: ${comparison.newIssues
        .filter((i) => i.severity === "critical")
        .slice(0, 3)
        .map((i) => i.title)
        .join(", ")}${count > 3 ? "…" : ""}`,
    });
  }

  if (current.summary.critical > previous.summary.critical) {
    alerts.push({
      type: "critical_increase",
      message: `Critical issues increased from ${previous.summary.critical} to ${current.summary.critical}.`,
    });
  }

  const prevAvg = Math.round(
    (previous.scores.seo +
      previous.scores.performance +
      previous.scores.accessibility +
      previous.scores.security) /
      4
  );
  const currAvg = Math.round(
    (current.scores.seo +
      current.scores.performance +
      current.scores.accessibility +
      current.scores.security) /
      4
  );

  if (currAvg < prevAvg - 5) {
    alerts.push({
      type: "score_drop",
      message: `Overall SEO score dropped from ${prevAvg} to ${currAvg}.`,
    });
  }

  if (comparison.fixed.length > 0) {
    alerts.push({
      type: "issues_fixed",
      message: `${comparison.fixed.length} issue${comparison.fixed.length === 1 ? "" : "s"} fixed since last scan.`,
    });
  }

  if (comparison.checklist && comparison.checklist.hasCountDelta !== 0) {
    alerts.push({
      type: "checklist_change",
      message: `Checklist: ${comparison.checklist.hasCountBefore} → ${comparison.checklist.hasCountAfter} items passing.`,
    });
  }

  return alerts;
}

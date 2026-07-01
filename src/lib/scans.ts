import type { AuditReport } from "@/lib/types";
import { prisma } from "@/lib/db";

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
  type: "critical_increase" | "score_drop" | "new_critical_issues";
  message: string;
}

export function compareScans(previous: AuditReport, current: AuditReport): ScanAlert[] {
  const alerts: ScanAlert[] = [];

  const prevCritical = previous.summary.critical;
  const currCritical = current.summary.critical;

  if (currCritical > prevCritical) {
    alerts.push({
      type: "critical_increase",
      message: `Critical issues increased from ${prevCritical} to ${currCritical}.`,
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

  const prevTitles = new Set(
    previous.issues.filter((i) => i.severity === "critical").map((i) => i.title)
  );
  const newCritical = current.issues.filter(
    (i) => i.severity === "critical" && !prevTitles.has(i.title)
  );

  if (newCritical.length > 0) {
    const sample = newCritical
      .slice(0, 3)
      .map((i) => i.title)
      .join(", ");
    alerts.push({
      type: "new_critical_issues",
      message: `New critical issues: ${sample}${newCritical.length > 3 ? "…" : ""}`,
    });
  }

  return alerts;
}

import { safeFetch } from "@/lib/fetcher";
import { runSeoAudit } from "@/lib/audit/seo";
import { runAccessibilityAudit } from "@/lib/audit/accessibility";
import { runSecurityAudit } from "@/lib/audit/security";
import { runLinksAudit } from "@/lib/audit/links";
import { runPerformanceAudit } from "@/lib/audit/performance";
import {
  AuditReport,
  computeCategoryScore,
  computeSummary,
  resetIssueCounter,
} from "@/lib/types";

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export async function runFullAudit(url: string): Promise<AuditReport> {
  resetIssueCounter();

  const fetchResult = await safeFetch(url);

  if (!fetchResult.html && fetchResult.status < 400) {
    throw new Error("Could not retrieve HTML content from the URL");
  }

  const ctx = { url: fetchResult.finalUrl, fetchResult };

  const [seoIssues, linkIssues, perfResult] = await Promise.all([
    runSeoAudit(ctx),
    runLinksAudit(ctx),
    runPerformanceAudit(fetchResult.finalUrl),
  ]);

  const accessibilityIssues = runAccessibilityAudit(ctx);
  const securityIssues = runSecurityAudit(ctx);

  const allIssues = [
    ...seoIssues,
    ...accessibilityIssues,
    ...securityIssues,
    ...linkIssues,
    ...perfResult.issues,
  ];

  allIssues.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  let performanceScore = computeCategoryScore(allIssues, "performance");
  if (perfResult.performanceScore !== undefined) {
    performanceScore = perfResult.performanceScore;
  }

  let accessibilityScore = computeCategoryScore(allIssues, "accessibility");
  if (perfResult.accessibilityScore !== undefined) {
    accessibilityScore = perfResult.accessibilityScore;
  }

  return {
    url: fetchResult.finalUrl,
    scannedAt: new Date().toISOString(),
    scores: {
      seo: computeCategoryScore(allIssues, "seo"),
      performance: performanceScore,
      accessibility: accessibilityScore,
      security: computeCategoryScore(allIssues, "security"),
    },
    issues: allIssues,
    summary: computeSummary(allIssues),
    performanceMetrics: perfResult.metrics,
    performanceNote: perfResult.note,
  };
}

import { safeFetch } from "@/lib/fetcher";
import { runSeoAudit } from "@/lib/audit/seo";
import { runAccessibilityAudit } from "@/lib/audit/accessibility";
import { runSecurityAudit } from "@/lib/audit/security";
import { runLinksAudit } from "@/lib/audit/links";
import { runPerformanceAudit } from "@/lib/audit/performance";
import { runContentAudit, extractPageMeta } from "@/lib/audit/content";
import { runImageAudit } from "@/lib/audit/images";
import { runMobileSocialAudit } from "@/lib/audit/mobile-social";
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
  const contentIssues = runContentAudit(ctx);
  const imageIssues = runImageAudit(ctx);
  const mobileSocialIssues = runMobileSocialAudit(ctx);

  const pageMeta = extractPageMeta(ctx);

  const allIssues = [
    ...seoIssues,
    ...contentIssues,
    ...mobileSocialIssues,
    ...imageIssues,
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

  let displayUrl = fetchResult.finalUrl;
  try {
    const parsed = new URL(fetchResult.finalUrl);
    displayUrl = parsed.hostname + parsed.pathname;
  } catch {
    // keep full url
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
    serpPreview: {
      title: pageMeta.title,
      description: pageMeta.description,
      url: displayUrl,
    },
  };
}

import {
  AuditIssue,
  createIssue,
  PerformanceMetrics,
} from "@/lib/types";

interface PageSpeedResult {
  issues: AuditIssue[];
  metrics?: PerformanceMetrics;
  performanceScore?: number;
  accessibilityScore?: number;
  note?: string;
}

function formatMs(value: number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export async function runPerformanceAudit(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    return {
      issues: [
        createIssue({
          category: "performance",
          severity: "info",
          title: "Performance audit skipped",
          description:
            "PageSpeed Insights API key is not configured. Performance and Core Web Vitals checks require a free Google API key.",
          recommendation:
            "Set PAGESPEED_API_KEY in your .env.local file. Get a free key at https://developers.google.com/speed/docs/insights/v5/get-started",
        }),
      ],
      note: "Configure PAGESPEED_API_KEY to enable performance scoring.",
    };
  }

  try {
    const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("key", apiKey);
    apiUrl.searchParams.set("category", "performance");
    apiUrl.searchParams.append("category", "accessibility");
    apiUrl.searchParams.set("strategy", "mobile");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(apiUrl.href, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`PageSpeed API returned ${response.status}`);
    }

    const data = await response.json();
    const issues: AuditIssue[] = [];
    const lighthouse = data.lighthouseResult;
    const categories = lighthouse?.categories ?? {};
    const audits = lighthouse?.audits ?? {};

    const performanceScore = categories.performance?.score
      ? Math.round(categories.performance.score * 100)
      : undefined;
    const accessibilityScore = categories.accessibility?.score
      ? Math.round(categories.accessibility.score * 100)
      : undefined;

    const metrics: PerformanceMetrics = {
      lcp: formatMs(audits["largest-contentful-paint"]?.numericValue),
      cls: audits["cumulative-layout-shift"]?.displayValue,
      inp: formatMs(audits["interaction-to-next-paint"]?.numericValue ?? audits["max-potential-fid"]?.numericValue),
      fcp: formatMs(audits["first-contentful-paint"]?.numericValue),
      ttfb: formatMs(audits["server-response-time"]?.numericValue),
    };

    if (performanceScore !== undefined && performanceScore < 90) {
      const severity = performanceScore < 50 ? "critical" : performanceScore < 75 ? "warning" : "info";
      issues.push(
        createIssue({
          category: "performance",
          severity,
          title: `Performance score: ${performanceScore}/100`,
          description:
            "Core Web Vitals affect user experience and Google search rankings. Scores below 90 indicate room for improvement.",
          currentValue: `LCP: ${metrics.lcp ?? "N/A"}, CLS: ${metrics.cls ?? "N/A"}, INP: ${metrics.inp ?? "N/A"}`,
          recommendation: "Optimize images, reduce JavaScript, enable compression, and use a CDN.",
        })
      );
    }

    if (accessibilityScore !== undefined && accessibilityScore < 90) {
      const severity = accessibilityScore < 50 ? "critical" : accessibilityScore < 75 ? "warning" : "info";
      issues.push(
        createIssue({
          category: "accessibility",
          severity,
          title: `Lighthouse accessibility score: ${accessibilityScore}/100`,
          description:
            "Lighthouse found accessibility issues beyond basic HTML checks. Review the full Lighthouse report for details.",
          currentValue: `Score: ${accessibilityScore}/100`,
          recommendation: "Fix color contrast, ARIA attributes, and keyboard navigation issues.",
        })
      );
    }

    const failingAudits = [
      "render-blocking-resources",
      "unused-css-rules",
      "unused-javascript",
      "uses-optimized-images",
      "uses-text-compression",
      "uses-responsive-images",
      "efficient-animated-content",
      "total-byte-weight",
    ];

    for (const auditId of failingAudits) {
      const audit = audits[auditId];
      if (audit && audit.score !== null && audit.score < 0.9) {
        issues.push(
          createIssue({
            category: "performance",
            severity: audit.score < 0.5 ? "warning" : "info",
            title: audit.title || auditId,
            description: audit.description || "Performance improvement opportunity identified by Lighthouse.",
            currentValue: audit.displayValue,
            recommendation: "See Lighthouse documentation for specific optimization steps.",
          })
        );
      }
    }

    return { issues, metrics, performanceScore, accessibilityScore };
  } catch (err) {
    return {
      issues: [
        createIssue({
          category: "performance",
          severity: "warning",
          title: "Performance audit failed",
          description:
            err instanceof Error ? err.message : "Could not reach PageSpeed Insights API.",
          recommendation: "Check your API key and try again, or verify the URL is publicly accessible.",
        }),
      ],
      note: "Performance audit encountered an error.",
    };
  }
}

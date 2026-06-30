import * as cheerio from "cheerio";
import { AuditContext, AuditIssue, createIssue, PerformanceMetrics } from "@/lib/types";

export interface PerformanceResult {
  issues: AuditIssue[];
  metrics?: PerformanceMetrics;
  performanceScore?: number;
  accessibilityScore?: number;
}

function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function runLocalPerformanceChecks(ctx: AuditContext): PerformanceResult {
  const issues: AuditIssue[] = [];
  const { html, headers, responseTimeMs, htmlSizeBytes } = ctx.fetchResult;
  const $ = cheerio.load(html);

  const metrics: PerformanceMetrics = {
    ttfb: responseTimeMs !== undefined ? formatMs(responseTimeMs) : undefined,
  };

  if (responseTimeMs !== undefined) {
    if (responseTimeMs > 3000) {
      issues.push(
        createIssue({
          category: "performance",
          severity: "critical",
          title: "Very slow server response",
          description: "Time to first byte over 3 seconds hurts user experience and SEO.",
          currentValue: formatMs(responseTimeMs),
          recommendation: "Upgrade hosting, enable caching, or use a CDN.",
        })
      );
    } else if (responseTimeMs > 1000) {
      issues.push(
        createIssue({
          category: "performance",
          severity: "warning",
          title: "Slow server response",
          description: "TTFB over 1 second suggests server or network latency.",
          currentValue: formatMs(responseTimeMs),
          recommendation: "Enable server caching and use a CDN.",
        })
      );
    }
  }

  if (htmlSizeBytes !== undefined && htmlSizeBytes > 500 * 1024) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "warning",
        title: "Large HTML page size",
        description: "Heavy HTML slows initial page load on mobile networks.",
        currentValue: formatBytes(htmlSizeBytes),
        recommendation: "Minify HTML and lazy-load below-fold content.",
      })
    );
    metrics.fcp = formatBytes(htmlSizeBytes) + " HTML";
  }

  const scripts = $("script[src]");
  const stylesheets = $('link[rel="stylesheet"]');
  const blockingScripts = $("head script[src]").filter((_, el) => {
    return $(el).attr("async") === undefined && $(el).attr("defer") === undefined;
  });

  if (scripts.length > 15) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "warning",
        title: "Too many JavaScript files",
        description: "Each script adds a network request and slows page load.",
        currentValue: `${scripts.length} external scripts`,
        recommendation: "Bundle JavaScript and remove unused scripts.",
      })
    );
  }

  if (blockingScripts.length > 3) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "warning",
        title: "Render-blocking scripts in head",
        description: "Scripts in <head> without async/defer block rendering.",
        currentValue: `${blockingScripts.length} blocking scripts`,
        recommendation: 'Add defer or async, or move scripts before </body>.',
        fixSnippet: '<script src="/app.js" defer></script>',
      })
    );
  }

  const encoding = headers["content-encoding"] || "";
  if (!encoding.includes("gzip") && !encoding.includes("br")) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "warning",
        title: "No text compression enabled",
        description: "Gzip or Brotli reduces page size by 60–80%.",
        currentValue: encoding || "No compression",
        recommendation: "Enable gzip or Brotli on your server or CDN.",
      })
    );
  }

  return { issues, metrics };
}

async function runPageSpeedChecks(url: string): Promise<PerformanceResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return { issues: [] };

  try {
    const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("key", apiKey);
    apiUrl.searchParams.set("category", "performance");
    apiUrl.searchParams.append("category", "accessibility");
    apiUrl.searchParams.set("strategy", "mobile");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(apiUrl.href, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return { issues: [] };

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
      lcp: audits["largest-contentful-paint"]?.displayValue,
      cls: audits["cumulative-layout-shift"]?.displayValue,
      inp: audits["interaction-to-next-paint"]?.displayValue ??
        audits["max-potential-fid"]?.displayValue,
      fcp: audits["first-contentful-paint"]?.displayValue,
    };

    if (performanceScore !== undefined && performanceScore < 90) {
      const severity = performanceScore < 50 ? "critical" : performanceScore < 75 ? "warning" : "info";
      issues.push(
        createIssue({
          category: "performance",
          severity,
          title: `Lighthouse performance score: ${performanceScore}/100`,
          description: "Core Web Vitals affect rankings and user experience.",
          currentValue: `LCP: ${metrics.lcp ?? "N/A"}, CLS: ${metrics.cls ?? "N/A"}`,
          recommendation: "Optimize images, reduce JavaScript, enable compression.",
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
          description: "Lighthouse found accessibility issues beyond HTML checks.",
          currentValue: `Score: ${accessibilityScore}/100`,
          recommendation: "Fix color contrast, ARIA attributes, and keyboard navigation.",
        })
      );
    }

    return { issues, metrics, performanceScore, accessibilityScore };
  } catch {
    return { issues: [] };
  }
}

export async function runPerformanceAudit(ctx: AuditContext): Promise<PerformanceResult> {
  const local = runLocalPerformanceChecks(ctx);
  const pageSpeed = await runPageSpeedChecks(ctx.fetchResult.finalUrl);

  return {
    issues: [...local.issues, ...pageSpeed.issues],
    metrics: { ...local.metrics, ...pageSpeed.metrics },
    performanceScore: pageSpeed.performanceScore,
    accessibilityScore: pageSpeed.accessibilityScore,
  };
}

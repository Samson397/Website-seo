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
  }

  const scripts = $("script[src]");
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
        recommendation: "Add defer or async, or move scripts before </body>.",
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

type LighthouseAudit = {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    items?: unknown[];
  };
};

type CruxMetrics = Record<
  string,
  { category?: string; percentile?: number } | undefined
>;

function cruxDisplay(metric: { category?: string; percentile?: number } | undefined, unit: "ms" | "s" | "cls"): string | undefined {
  if (!metric || metric.percentile === undefined) return undefined;
  const p = metric.percentile;
  if (unit === "cls") return String(p);
  if (unit === "s") return `${(p / 1000).toFixed(1)} s`;
  return `${Math.round(p)} ms`;
}

function opportunitySeverity(audit: LighthouseAudit): "critical" | "warning" | "info" {
  const ms = audit.details?.overallSavingsMs ?? 0;
  const bytes = audit.details?.overallSavingsBytes ?? 0;
  if (ms >= 1000 || bytes >= 200_000) return "critical";
  if (ms >= 300 || bytes >= 50_000 || (audit.score !== null && audit.score !== undefined && audit.score < 0.5)) {
    return "warning";
  }
  return "info";
}

function extractOpportunities(audits: Record<string, LighthouseAudit>): AuditIssue[] {
  const scored: { audit: LighthouseAudit; weight: number }[] = [];

  for (const audit of Object.values(audits)) {
    if (!audit?.title) continue;
    const type = audit.details?.type;
    const isOpportunity = type === "opportunity";
    const isFailingDiagnostic =
      type === "table" &&
      audit.scoreDisplayMode === "metricSavings" &&
      audit.score !== null &&
      audit.score !== undefined &&
      audit.score < 1;
    if (!isOpportunity && !isFailingDiagnostic) continue;
    if (audit.score === 1) continue;

    const weight =
      (audit.details?.overallSavingsMs ?? 0) +
      (audit.details?.overallSavingsBytes ?? 0) / 100 +
      (audit.score === 0 ? 500 : 0);
    scored.push({ audit, weight });
  }

  scored.sort((a, b) => b.weight - a.weight);

  const issues: AuditIssue[] = [];
  const seen = new Set<string>();
  for (const { audit } of scored.slice(0, 10)) {
    const title = audit.title!;
    if (seen.has(title)) continue;
    seen.add(title);
    const savingsParts = [
      audit.displayValue,
      audit.details?.overallSavingsMs
        ? `~${Math.round(audit.details.overallSavingsMs)}ms potential`
        : null,
      audit.details?.overallSavingsBytes
        ? formatBytes(audit.details.overallSavingsBytes)
        : null,
    ].filter(Boolean);

    issues.push(
      createIssue({
        category: "performance",
        severity: opportunitySeverity(audit),
        title: `PageSpeed: ${title}`,
        description:
          (audit.description || "Lighthouse flagged this performance opportunity.")
            .replace(/\[.*?\]\(.*?\)/g, "")
            .trim()
            .slice(0, 280) || "Lighthouse flagged this performance opportunity.",
        currentValue: savingsParts.join(" · ") || undefined,
        recommendation: "Address this Lighthouse opportunity — it contributes to Core Web Vitals and mobile speed.",
      })
    );
  }
  return issues;
}

function extractAccessibilityFailures(audits: Record<string, LighthouseAudit>): AuditIssue[] {
  const failures: LighthouseAudit[] = [];
  for (const audit of Object.values(audits)) {
    if (!audit?.title) continue;
    if (audit.scoreDisplayMode !== "binary") continue;
    if (audit.score !== 0) continue;
    // Skip noisy / not-applicable style audits without items
    const itemCount = Array.isArray(audit.details?.items) ? audit.details!.items!.length : 0;
    if (itemCount === 0 && !audit.displayValue) continue;
    failures.push(audit);
  }

  return failures.slice(0, 10).map((audit) => {
    const itemCount = Array.isArray(audit.details?.items) ? audit.details!.items!.length : 0;
    return createIssue({
      category: "accessibility",
      severity: "warning",
      title: `PageSpeed a11y: ${audit.title}`,
      description:
        (audit.description || "Lighthouse accessibility audit failed.")
          .replace(/\[.*?\]\(.*?\)/g, "")
          .trim()
          .slice(0, 280) || "Lighthouse accessibility audit failed.",
      currentValue: itemCount > 0 ? `${itemCount} failing element(s)` : audit.displayValue,
      recommendation: "Fix the failing elements flagged by Lighthouse (contrast, names, ARIA, and structure).",
    });
  });
}

function extractCrux(
  experience: { metrics?: CruxMetrics; overall_category?: string } | undefined
): Pick<PerformanceMetrics, "fieldLcp" | "fieldCls" | "fieldInp" | "fieldCategory"> {
  if (!experience?.metrics) return {};
  const m = experience.metrics;
  return {
    fieldLcp: cruxDisplay(m.LARGEST_CONTENTFUL_PAINT_MS, "ms"),
    fieldCls: cruxDisplay(m.CUMULATIVE_LAYOUT_SHIFT_SCORE, "cls"),
    fieldInp:
      cruxDisplay(m.INTERACTION_TO_NEXT_PAINT, "ms") ||
      cruxDisplay(m.FIRST_INPUT_DELAY_MS, "ms"),
    fieldCategory: experience.overall_category,
  };
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
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch(apiUrl.href, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return { issues: [] };

    const data = await response.json();
    const issues: AuditIssue[] = [];
    const lighthouse = data.lighthouseResult;
    const categories = lighthouse?.categories ?? {};
    const audits = (lighthouse?.audits ?? {}) as Record<string, LighthouseAudit>;

    const performanceScore = categories.performance?.score
      ? Math.round(categories.performance.score * 100)
      : undefined;
    const accessibilityScore = categories.accessibility?.score
      ? Math.round(categories.accessibility.score * 100)
      : undefined;

    const field = data.loadingExperience?.metrics
      ? extractCrux(data.loadingExperience)
      : extractCrux(data.originLoadingExperience);

    const metrics: PerformanceMetrics = {
      lcp: audits["largest-contentful-paint"]?.displayValue,
      cls: audits["cumulative-layout-shift"]?.displayValue,
      inp:
        audits["interaction-to-next-paint"]?.displayValue ??
        audits["max-potential-fid"]?.displayValue,
      fcp: audits["first-contentful-paint"]?.displayValue,
      ...field,
    };

    if (performanceScore !== undefined && performanceScore < 90) {
      const severity =
        performanceScore < 50 ? "critical" : performanceScore < 75 ? "warning" : "info";
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
      const severity =
        accessibilityScore < 50 ? "critical" : accessibilityScore < 75 ? "warning" : "info";
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

    issues.push(...extractOpportunities(audits));
    issues.push(...extractAccessibilityFailures(audits));

    if (field.fieldCategory && field.fieldCategory !== "FAST") {
      issues.push(
        createIssue({
          category: "performance",
          severity: field.fieldCategory === "SLOW" ? "warning" : "info",
          title: `Chrome UX Report (field): ${field.fieldCategory.toLowerCase()}`,
          description:
            "Real-user Core Web Vitals from Chrome (field data), not just the lab Lighthouse run.",
          currentValue: [
            field.fieldLcp && `LCP ${field.fieldLcp}`,
            field.fieldCls && `CLS ${field.fieldCls}`,
            field.fieldInp && `INP ${field.fieldInp}`,
          ]
            .filter(Boolean)
            .join(" · ") || field.fieldCategory,
          recommendation:
            "Prioritize field LCP/CLS/INP fixes on popular templates — Search uses field data when available.",
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

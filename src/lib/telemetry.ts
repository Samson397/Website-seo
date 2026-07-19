import type { AuditReport } from "@/lib/types";
import { forwardWebhook, insertScanEvent, type ScanEventInput } from "@/lib/store";

function metricSnippet(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 32) : null;
}

export function buildScanEvent(report: AuditReport): ScanEventInput {
  let hostname = "unknown";
  let tld = "";
  try {
    const host = new URL(report.url).hostname.replace(/^www\./, "");
    hostname = host;
    const parts = host.split(".");
    tld = parts.length >= 2 ? parts.slice(-2).join(".") : host;
    if (parts.length >= 3 && ["co.uk", "com.au", "co.nz"].includes(parts.slice(-2).join("."))) {
      tld = parts.slice(-2).join(".");
    } else if (parts.length >= 2) {
      tld = parts[parts.length - 1];
    }
  } catch {
    // keep defaults
  }

  const overall = Math.round(
    (report.scores.seo +
      report.scores.performance +
      report.scores.accessibility +
      report.scores.security) /
      4
  );

  const technologies = (report.siteOverview?.technologies || [])
    .map((t) => t.name.trim())
    .filter(Boolean)
    .slice(0, 15);

  const topFailIds = (report.checklist?.items || [])
    .filter((item) => item.status === "fail")
    .map((item) => item.id)
    .filter(Boolean)
    .slice(0, 10);

  const aiScore =
    typeof report.aiVisibility?.score === "number"
      ? Math.round(report.aiVisibility.score)
      : typeof report.scores.ai === "number"
        ? Math.round(report.scores.ai)
        : null;

  const overview = report.siteOverview;
  const dns = overview?.dns;
  const ssl = overview?.ssl;

  return {
    hostname,
    tld,
    overall,
    seo: report.scores.seo,
    performance: report.scores.performance,
    accessibility: report.scores.accessibility,
    security: report.scores.security,
    passCount: report.checklist?.passCount ?? report.checklist?.hasCount ?? 0,
    failCount: report.checklist?.failCount ?? report.checklist?.missingCount ?? 0,
    attentionCount: report.checklist?.attentionCount ?? report.checklist?.warningCount ?? 0,
    pagesScanned: report.crawl?.pagesScanned ?? 1,
    criticalIssues: report.summary.critical,
    warningIssues: report.summary.warning,
    scannedAt: report.scannedAt,
    technologies,
    topFailIds,
    aiScore,
    lcp: metricSnippet(report.performanceMetrics?.lcp),
    cls: metricSnippet(report.performanceMetrics?.cls),
    inp: metricSnippet(report.performanceMetrics?.inp),
    tier: report.tier === "full" || report.tier === "free" ? report.tier : null,
    hasSpf: typeof dns?.hasSpf === "boolean" ? dns.hasSpf : null,
    hasDmarc: typeof dns?.hasDmarc === "boolean" ? dns.hasDmarc : null,
    hasSsl: overview
      ? Boolean(ssl?.issuer || ssl?.validTo || ssl?.protocol || typeof ssl?.daysUntilExpiry === "number")
      : null,
  };
}

/** Persist anonymized public-site scan stats (no emails, no cookies, no account IDs). */
export async function recordScanTelemetry(report: AuditReport): Promise<void> {
  const event = buildScanEvent(report);
  try {
    await insertScanEvent(event);
  } catch (err) {
    console.error("[telemetry] store failed", err instanceof Error ? err.message : err);
  }
  await forwardWebhook({ type: "scan_event", event });
}

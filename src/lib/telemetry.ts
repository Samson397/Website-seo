import type { AuditReport } from "@/lib/types";
import { forwardWebhook, insertScanEvent, type ScanEventInput } from "@/lib/store";

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

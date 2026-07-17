import { NextRequest, NextResponse } from "next/server";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { recordScanTelemetry } from "@/lib/telemetry";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { canPersistReports, saveSharedReport } from "@/lib/reports";

/** Allow longer full-site crawls on platforms that support it (e.g. Vercel Pro). */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`audit:${clientKeyFromRequest(request)}`, {
      limit: 12,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${limited.retryAfterSec}s.` },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        }
      );
    }

    const body = await request.json();
    const urlInput = body?.url;
    const siteCrawl = body?.siteCrawl !== false;
    const share = body?.share !== false;

    if (!urlInput || typeof urlInput !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await validateUrlSafe(urlInput);
    const normalized = normalizeUrl(urlInput);
    const report = await runFullAudit(normalized, { siteCrawl });

    void recordScanTelemetry(report);

    if (share && canPersistReports()) {
      try {
        report.shareId = await saveSharedReport(report);
      } catch (err) {
        console.error("[audit] share save failed", err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json(report, {
      headers: { "X-RateLimit-Remaining": String(limited.remaining) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    const status = message.includes("not allowed") || message.includes("resolve") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

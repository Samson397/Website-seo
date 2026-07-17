import { NextRequest, NextResponse } from "next/server";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { recordScanTelemetry } from "@/lib/telemetry";

/** Allow longer full-site crawls on platforms that support it (e.g. Vercel Pro). */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urlInput = body?.url;
    // Default: full site crawl. Competitors may pass siteCrawl: false for speed.
    const siteCrawl = body?.siteCrawl !== false;

    if (!urlInput || typeof urlInput !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await validateUrlSafe(urlInput);
    const normalized = normalizeUrl(urlInput);
    const report = await runFullAudit(normalized, { siteCrawl });

    // Anonymized public-site stats for benchmarks / insights product (non-blocking)
    void recordScanTelemetry(report);

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    const status = message.includes("not allowed") || message.includes("resolve") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

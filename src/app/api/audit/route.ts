import { NextRequest, NextResponse } from "next/server";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { recordScanTelemetry } from "@/lib/telemetry";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { canPersistReports, saveSharedReport } from "@/lib/reports";
import { isStripeConfigured } from "@/lib/stripe";
import { verifyPaidSession } from "@/lib/stripe-unlock-server";
import { toFreePreviewReport } from "@/lib/free-preview";

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
    const unlockSessionId =
      typeof body?.unlockSessionId === "string" ? body.unlockSessionId : undefined;
    const wantFull = body?.siteCrawl !== false;
    const share = body?.share !== false;

    if (!urlInput || typeof urlInput !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let siteCrawl = wantFull;
    let tier: "free" | "full" = "full";

    if (isStripeConfigured()) {
      if (wantFull && unlockSessionId) {
        const paid = await verifyPaidSession(unlockSessionId);
        if (!paid) {
          return NextResponse.json(
            {
              error:
                "Payment could not be verified for a full crawl. Re-open Unlock and complete checkout, or run a free homepage preview.",
            },
            { status: 402 }
          );
        }
        siteCrawl = true;
        tier = "full";
      } else {
        siteCrawl = false;
        tier = "free";
      }
    }

    await validateUrlSafe(urlInput);
    const normalized = normalizeUrl(urlInput);
    const report = await runFullAudit(normalized, { siteCrawl });

    void recordScanTelemetry(report);

    let responseReport =
      tier === "free" ? toFreePreviewReport(report) : { ...report, tier: "full" as const };

    if (tier === "full" && share && canPersistReports()) {
      try {
        responseReport = {
          ...responseReport,
          shareId: await saveSharedReport(responseReport),
        };
      } catch (err) {
        console.error("[audit] share save failed", err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json(responseReport, {
      headers: {
        "X-RateLimit-Remaining": String(limited.remaining),
        "X-SEOHub-Tier": tier,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    const status = message.includes("not allowed") || message.includes("resolve") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

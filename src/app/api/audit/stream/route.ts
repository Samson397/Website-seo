import { NextRequest } from "next/server";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { recordScanTelemetry } from "@/lib/telemetry";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { maybeCreateSpotlightFromPaidScan } from "@/lib/blog-spotlights";
import { canPersistReports, savePreviewReport, saveSharedReport } from "@/lib/reports";
import { isStripeConfigured } from "@/lib/stripe";
import {
  claimUnlockSession,
  consumeUnlockSession,
  releaseUnlockSessionClaim,
} from "@/lib/unlock-access";
import { isPromoSessionId } from "@/lib/promo-codes";
import { toFreePreviewReport } from "@/lib/free-preview";
import { auditOptionsFromBody } from "@/lib/audit-request";
import type { AuditOptions, ScanProgressEvent } from "@/lib/types";

export const maxDuration = 300;
export const runtime = "nodejs";

/** NDJSON stream of scan progress + final report. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`audit:${clientKeyFromRequest(request)}`, {
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return new Response(
      JSON.stringify({
        type: "error",
        error: `Rate limit reached. Try again in ${limited.retryAfterSec}s.`,
      }) + "\n",
      {
        status: 429,
        headers: {
          "Content-Type": "application/x-ndjson",
          "Retry-After": String(limited.retryAfterSec),
        },
      }
    );
  }

  let urlInput: string | undefined;
  let wantFull = true;
  let unlockSessionId: string | undefined;
  let crawlOptions: Omit<AuditOptions, "onProgress" | "siteCrawl"> = {};
  try {
    const body = await request.json();
    urlInput = body?.url;
    const parsed = auditOptionsFromBody(body);
    wantFull = parsed.wantFull;
    unlockSessionId = parsed.unlockSessionId;
    crawlOptions = parsed.auditOptions;
  } catch {
    return new Response(JSON.stringify({ type: "error", error: "Invalid JSON" }) + "\n", {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  if (!urlInput || typeof urlInput !== "string") {
    return new Response(JSON.stringify({ type: "error", error: "URL is required" }) + "\n", {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  let siteCrawl = wantFull;
  let tier: "free" | "full" = "full";
  let claimedSessionId: string | undefined;
  const gated =
    isStripeConfigured() || Boolean(unlockSessionId && isPromoSessionId(unlockSessionId));
  if (gated) {
    if (wantFull && unlockSessionId) {
      const claimed = await claimUnlockSession(unlockSessionId);
      if (claimed.status !== "valid") {
        return new Response(
          JSON.stringify({
            type: "error",
            error: claimed.error,
            code: claimed.status === "spent" ? "unlock_spent" : "unlock_invalid",
          }) + "\n",
          { status: 402, headers: { "Content-Type": "application/x-ndjson" } }
        );
      }
      claimedSessionId = unlockSessionId;
      siteCrawl = true;
      tier = "full";
    } else {
      siteCrawl = false;
      tier = "free";
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ScanProgressEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      let finalized = false;
      try {
        send({
          type: "stage",
          stage: "fetch",
          message:
            tier === "free"
              ? "Free preview — scanning homepage…"
              : "Full SEO unlock — starting site crawl…",
        });

        await validateUrlSafe(urlInput!);
        const normalized = normalizeUrl(urlInput!);
        const report = await runFullAudit(normalized, {
          siteCrawl,
          ...(siteCrawl ? crawlOptions : {}),
          onProgress: (event) => send(event),
        });

        void recordScanTelemetry(report);

        let responseReport =
          tier === "free" ? toFreePreviewReport(report) : { ...report, tier: "full" as const };

        if (canPersistReports()) {
          try {
            if (tier === "free") {
              // Stash full homepage audit for unlock-in-place (not public until paid)
              const previewId = await savePreviewReport(report);
              responseReport = { ...responseReport, previewId };
            } else {
              responseReport = {
                ...responseReport,
                shareId: await saveSharedReport(responseReport),
              };
            }
          } catch (err) {
            console.error("[stream] report save failed", err instanceof Error ? err.message : err);
          }
        }

        // One checkout / promo redeem = one full-site scan
        if (tier === "full" && claimedSessionId) {
          try {
            await maybeCreateSpotlightFromPaidScan(responseReport, claimedSessionId);
          } catch (err) {
            console.error(
              "[stream] spotlight create failed",
              err instanceof Error ? err.message : err
            );
          }
          try {
            await consumeUnlockSession(claimedSessionId);
            finalized = true;
          } catch (err) {
            console.error(
              "[stream] consume session failed",
              err instanceof Error ? err.message : err
            );
          }
        }

        send({ type: "done", report: responseReport });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Audit failed",
        });
      } finally {
        if (claimedSessionId && !finalized) {
          try {
            await releaseUnlockSessionClaim(claimedSessionId);
          } catch (err) {
            console.error(
              "[stream] release claim failed",
              err instanceof Error ? err.message : err
            );
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-RateLimit-Remaining": String(limited.remaining),
      "X-SEOHub-Tier": tier,
    },
  });
}

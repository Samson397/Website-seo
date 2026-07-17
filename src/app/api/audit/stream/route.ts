import { NextRequest } from "next/server";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { recordScanTelemetry } from "@/lib/telemetry";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { canPersistReports, saveSharedReport } from "@/lib/reports";
import { isStripeConfigured } from "@/lib/stripe";
import { verifyPaidSession } from "@/lib/stripe-unlock-server";
import type { ScanProgressEvent } from "@/lib/types";

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
  try {
    const body = await request.json();
    urlInput = body?.url;
    wantFull = body?.siteCrawl !== false;
    unlockSessionId =
      typeof body?.unlockSessionId === "string" ? body.unlockSessionId : undefined;
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
  if (isStripeConfigured()) {
    const paid = wantFull ? await verifyPaidSession(unlockSessionId) : false;
    siteCrawl = paid;
    tier = paid ? "full" : "free";
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ScanProgressEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

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
          onProgress: (event) => send(event),
        });

        void recordScanTelemetry(report);

        if (tier === "full" && canPersistReports()) {
          try {
            report.shareId = await saveSharedReport(report);
          } catch (err) {
            console.error("[stream] share save failed", err instanceof Error ? err.message : err);
          }
        }

        send({ type: "done", report: { ...report, tier } as typeof report & { tier: string } });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Audit failed",
        });
      } finally {
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

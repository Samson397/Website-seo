import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { markPreviewUnlockSession, verifyUnlockSession } from "@/lib/unlock-access";
import { isPromoSessionId } from "@/lib/promo-codes";
import {
  canPersistReports,
  getPreviewReport,
  promotePreviewToShared,
} from "@/lib/reports";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Unlock a stashed free-preview report in place (no re-crawl).
 * Body: { previewId, sessionId } — sessionId is Stripe cs_… or promo_…
 * One session may promote at most one preview; full crawl still consumes later.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`audit-unlock:${clientKeyFromRequest(request)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${limited.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  if (!canPersistReports()) {
    return NextResponse.json(
      { error: "Report stash unavailable. Run a full scan after unlock instead." },
      { status: 503 }
    );
  }

  let previewId: string | undefined;
  let sessionId: string | undefined;
  try {
    const body = await request.json();
    previewId = typeof body?.previewId === "string" ? body.previewId : undefined;
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!previewId || !sessionId) {
    return NextResponse.json({ error: "previewId and sessionId are required" }, { status: 400 });
  }

  if (!isPromoSessionId(sessionId) && !isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const unlocked = await verifyUnlockSession(sessionId);
  if (!unlocked) {
    return NextResponse.json(
      {
        error:
          "Payment or promo code could not be verified, or was already used for a full scan.",
      },
      { status: 402 }
    );
  }

  const claimed = await markPreviewUnlockSession(sessionId);
  if (!claimed) {
    return NextResponse.json(
      {
        error:
          "This payment or promo was already used to unlock a preview. Run the full-site crawl, or pay again for another unlock.",
      },
      { status: 402 }
    );
  }

  const stashed = await getPreviewReport(previewId);
  if (!stashed) {
    return NextResponse.json(
      { error: "Preview expired. Run a new scan — unlock still works for a full crawl." },
      { status: 404 }
    );
  }

  const report = await promotePreviewToShared(previewId, stashed);
  return NextResponse.json({ report, shareId: report.shareId });
}

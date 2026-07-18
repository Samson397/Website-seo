import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { verifyPaidCheckoutSession } from "@/lib/stripe-unlock-server";
import { attachUnlockGrantCookie } from "@/lib/unlock-grant";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Confirm a Checkout session was paid — unlocks full SEO for the browser. */
export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
    }

    const limited = rateLimit(`stripe:verify:${clientKeyFromRequest(req)}`, {
      limit: 40,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const { sessionId } = (await req.json()) as { sessionId?: string };
    const result = await verifyPaidCheckoutSession(sessionId);

    if (!result.paid || !result.sessionId) {
      return NextResponse.json(
        { ok: false, paid: false, error: result.error || "Payment not completed" },
        { status: result.error?.includes("required") ? 400 : 402 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      paid: true,
      sessionId: result.sessionId,
      targetUrl: result.targetUrl ?? null,
      amountTotal: result.amountTotal,
      currency: result.currency,
    });
    attachUnlockGrantCookie(res, result.sessionId);
    return res;
  } catch (err) {
    console.error("[stripe/verify]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verify failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
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

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

    const { sessionId } = (await req.json()) as { sessionId?: string };
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    if (!paid) {
      return NextResponse.json({ ok: false, paid: false, error: "Payment not completed" }, { status: 402 });
    }

    return NextResponse.json({
      ok: true,
      paid: true,
      sessionId: session.id,
      targetUrl: session.metadata?.targetUrl || null,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("[stripe/verify]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verify failed" },
      { status: 500 }
    );
  }
}

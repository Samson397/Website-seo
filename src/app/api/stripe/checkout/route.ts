import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { getStripe, getStripePriceId, isStripeConfigured } from "@/lib/stripe";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
    }

    const limited = rateLimit(`stripe:checkout:${clientKeyFromRequest(req)}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many checkout attempts." }, { status: 429 });
    }

    const stripe = getStripe();
    const priceId = getStripePriceId();
    if (!stripe || !priceId) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const body = (await req.json().catch(() => ({}))) as { url?: string; returnPath?: string };
    const siteUrl = getSiteUrl();
    const returnPath = body.returnPath?.startsWith("/") ? body.returnPath : "/";
    const successUrl = `${siteUrl}${returnPath}${returnPath.includes("?") ? "&" : "?"}unlock_session={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}${returnPath}${returnPath.includes("?") ? "&" : "?"}checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        app: "seohub",
        product: "full_seo_scan",
        targetUrl: body.url?.slice(0, 500) || "",
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}

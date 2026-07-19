import { NextRequest, NextResponse } from "next/server";
import { getStripe, getStripePriceId, isStripeConfigured } from "@/lib/stripe";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { getRequestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Payments are not configured on this deployment. Add STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel → Settings → Environment Variables, then redeploy.",
        },
        { status: 503 }
      );
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

    const body = (await req.json().catch(() => ({}))) as {
      url?: string;
      spotlight?: boolean;
    };
    const origin = getRequestOrigin(req);
    const targetUrl = typeof body.url === "string" ? body.url.slice(0, 500) : "";
    const spotlight = Boolean(body.spotlight);

    // Stripe replaces {CHECKOUT_SESSION_ID} literally — do not URL-encode the braces.
    const successUrl =
      `${origin}/unlock/success?session_id={CHECKOUT_SESSION_ID}` +
      (targetUrl ? `&url=${encodeURIComponent(targetUrl)}` : "");

    const cancelUrl =
      `${origin}/?checkout=cancelled` +
      (targetUrl ? `&url=${encodeURIComponent(targetUrl)}` : "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Instant unlock — avoid delayed methods that never hit payment_status=paid on return.
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "1" },
      metadata: {
        app: "seohub",
        product: "full_seo_scan",
        targetUrl,
        ...(spotlight ? { spotlight: "1" } : { spotlight: "0" }),
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

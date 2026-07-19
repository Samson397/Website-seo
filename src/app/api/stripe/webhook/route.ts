import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

/**
 * Stripe webhooks — marks checkout sessions paid/consumed metadata hooks.
 * Configure endpoint: /api/stripe/webhook with STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured (STRIPE_WEBHOOK_SECRET)." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.payment_status === "paid" &&
          session.metadata?.app === "seohub" &&
          session.metadata?.product === "full_seo_scan"
        ) {
          // Ensure app metadata is present for later verify/consume (idempotent).
          if (!session.metadata.webhookReceivedAt) {
            await stripe.checkout.sessions.update(session.id, {
              metadata: {
                ...session.metadata,
                webhookReceivedAt: new Date().toISOString(),
              },
            });
          }
        }
        break;
      }
      case "charge.refunded": {
        // Manual refunds in Dashboard — log for ops visibility.
        console.info("[stripe/webhook] charge.refunded", event.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

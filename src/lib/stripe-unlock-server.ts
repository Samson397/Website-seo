import { getStripe, getStripePriceId, FULL_SCAN_PRICE_CENTS } from "@/lib/stripe";
import { verifyUnlockGrant } from "@/lib/unlock-grant";

export interface PaidSessionResult {
  paid: boolean;
  sessionId?: string;
  targetUrl?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Confirm a Checkout session unlocks full-site crawl.
 * Paid + SEOHub metadata is enough; price-id mismatch is logged but not fatal
 * (price IDs change when moving $1.99 → $0.99, etc.).
 */
export async function verifyPaidCheckoutSession(
  sessionId: string | undefined | null
): Promise<PaidSessionResult> {
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return { paid: false, error: "Valid sessionId is required" };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { paid: false, error: "Stripe not configured" };
  }

  try {
    // Avoid expand failures breaking verification for otherwise valid payments.
    let session = await stripe.checkout.sessions.retrieve(sessionId);

    // Card checkout is usually paid on return; retry once if Stripe is still settling.
    if (session.payment_status !== "paid" && session.status === "complete") {
      await sleep(1200);
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } else if (session.payment_status !== "paid" && session.status === "open") {
      await sleep(1500);
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }

    const paidOk =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      (session.status === "complete" && session.payment_status !== "unpaid");

    if (!paidOk) {
      return {
        paid: false,
        sessionId: session.id,
        error: `Payment not completed (status=${session.status}, payment=${session.payment_status})`,
      };
    }

    if (session.metadata?.app !== "seohub" || session.metadata?.product !== "full_seo_scan") {
      return {
        paid: false,
        sessionId: session.id,
        error: "Checkout session is not a SEOHub full-scan unlock",
      };
    }

    // Soft price check — never reject a paid SEOHub unlock solely for price id drift.
    const expectedPrice = getStripePriceId();
    if (expectedPrice) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 5 });
        if (lineItems.data.length > 0) {
          const matched = lineItems.data.some((item) => {
            const price = item.price;
            const priceId = typeof price === "string" ? price : price?.id;
            return priceId === expectedPrice;
          });
          if (!matched) {
            const amount = session.amount_total;
            const amountOk =
              typeof amount === "number" &&
              amount > 0 &&
              amount <= Math.max(FULL_SCAN_PRICE_CENTS * 4, 1999);
            if (!amountOk) {
              console.warn(
                "[stripe-unlock] paid session price id differs from STRIPE_PRICE_ID",
                { sessionId, expectedPrice, amountTotal: amount }
              );
            }
          }
        }
      } catch (err) {
        console.warn(
          "[stripe-unlock] line item lookup failed; accepting paid metadata session",
          err instanceof Error ? err.message : err
        );
      }
    }

    return {
      paid: true,
      sessionId: session.id,
      targetUrl: session.metadata?.targetUrl || null,
      amountTotal: session.amount_total,
      currency: session.currency,
    };
  } catch (err) {
    console.error("[stripe-unlock] verify failed", err);
    return {
      paid: false,
      error: err instanceof Error ? err.message : "Verify failed",
    };
  }
}

/** Server-side: confirm a Checkout session unlocks full site crawl. */
export async function verifyPaidSession(sessionId: string | undefined | null): Promise<boolean> {
  const result = await verifyPaidCheckoutSession(sessionId);
  return result.paid;
}

/**
 * Full unlock auth for audit routes: accept signed grant cookie and/or live Stripe session.
 */
export async function authorizeFullUnlock(opts: {
  unlockSessionId?: string | null;
  grantCookie?: string | null;
}): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const grant = verifyUnlockGrant(opts.grantCookie);
  if (grant.ok) {
    return { ok: true, sessionId: grant.sessionId };
  }

  if (!opts.unlockSessionId) {
    return {
      ok: false,
      error: "No unlock session. Complete checkout to run a full crawl.",
    };
  }

  const result = await verifyPaidCheckoutSession(opts.unlockSessionId);
  if (!result.paid || !result.sessionId) {
    return {
      ok: false,
      error:
        result.error ||
        "Payment could not be verified for a full crawl. Re-open Unlock and complete checkout, or run a free homepage preview.",
    };
  }

  return { ok: true, sessionId: result.sessionId };
}

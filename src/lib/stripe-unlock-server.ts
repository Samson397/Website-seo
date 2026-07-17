import { getStripe, getStripePriceId } from "@/lib/stripe";

export interface PaidSessionResult {
  paid: boolean;
  sessionId?: string;
  targetUrl?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  error?: string;
}

/**
 * Strict Checkout verification for full-site unlock.
 * Requires payment_status=paid, SEOHub metadata, and matching price id when available.
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
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });

    if (session.payment_status !== "paid") {
      return {
        paid: false,
        sessionId: session.id,
        error: "Payment not completed",
      };
    }

    if (session.metadata?.app !== "seohub" || session.metadata?.product !== "full_seo_scan") {
      return {
        paid: false,
        sessionId: session.id,
        error: "Checkout session is not a SEOHub full-scan unlock",
      };
    }

    const expectedPrice = getStripePriceId();
    const lineItems = session.line_items?.data ?? [];
    if (expectedPrice && lineItems.length > 0) {
      const matched = lineItems.some((item) => {
        const price = item.price;
        const priceId = typeof price === "string" ? price : price?.id;
        return priceId === expectedPrice;
      });
      if (!matched) {
        return {
          paid: false,
          sessionId: session.id,
          error: "Checkout session price does not match this deployment",
        };
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

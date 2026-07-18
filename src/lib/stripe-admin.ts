import { getStripe, isStripeConfigured } from "@/lib/stripe";

export type AdminCheckoutRow = {
  id: string;
  status: string | null;
  paymentStatus: string | null;
  amountTotal: number | null;
  currency: string | null;
  url: string | null;
  customerEmail: string | null;
  createdAt: string;
  consumed: boolean;
};

/** Recent Checkout sessions from Stripe (no local payment table needed). */
export async function listRecentCheckoutsAdmin(limit = 30): Promise<{
  enabled: boolean;
  sessions: AdminCheckoutRow[];
  error?: string;
}> {
  if (!isStripeConfigured()) {
    return { enabled: false, sessions: [] };
  }
  const stripe = getStripe();
  if (!stripe) return { enabled: false, sessions: [] };

  try {
    const list = await stripe.checkout.sessions.list({
      limit: Math.max(1, Math.min(100, limit)),
    });
    const sessions: AdminCheckoutRow[] = list.data.map((s) => ({
      id: s.id,
      status: s.status,
      paymentStatus: s.payment_status,
      amountTotal: s.amount_total,
      currency: s.currency,
      url: typeof s.metadata?.url === "string" ? s.metadata.url : null,
      customerEmail: s.customer_details?.email || s.customer_email || null,
      createdAt: new Date((s.created || 0) * 1000).toISOString(),
      consumed: s.metadata?.consumed === "1",
    }));
    return { enabled: true, sessions };
  } catch (err) {
    return {
      enabled: true,
      sessions: [],
      error: err instanceof Error ? err.message : "Stripe list failed",
    };
  }
}

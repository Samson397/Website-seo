import { getStripe, getStripePriceId } from "@/lib/stripe";

/** Lease length for an in-flight full scan (covers long crawls + retries). */
const SCAN_CLAIM_TTL_MS = 15 * 60 * 1000;

export interface PaidSessionResult {
  paid: boolean;
  sessionId?: string;
  targetUrl?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  consumed?: boolean;
  /** ISO timestamp when a full scan claimed this session (lease). */
  scanClaimedAt?: string | null;
  /** Session already used to promote one stashed preview report. */
  previewUnlocked?: boolean;
  /** Opt-in: publish a site spotlight on the SEOHub blog after the full scan. */
  spotlight?: boolean;
  error?: string;
}

export type PaidUnlockInspectResult =
  | { status: "valid" }
  | { status: "spent" }
  | { status: "missing"; error?: string }
  | { status: "unavailable"; error?: string };

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

    const consumed = session.metadata?.consumed === "1";
    const scanClaimedAt = session.metadata?.scanClaimedAt || null;
    const previewUnlocked = session.metadata?.previewUnlocked === "1";
    const spotlight = session.metadata?.spotlight === "1";

    return {
      paid: true,
      sessionId: session.id,
      targetUrl: session.metadata?.targetUrl || null,
      amountTotal: session.amount_total,
      currency: session.currency,
      consumed,
      scanClaimedAt,
      previewUnlocked,
      spotlight,
    };
  } catch (err) {
    return {
      paid: false,
      error: err instanceof Error ? err.message : "Verify failed",
    };
  }
}

function claimIsActive(scanClaimedAt: string | null | undefined): boolean {
  if (!scanClaimedAt) return false;
  const claimedMs = Date.parse(scanClaimedAt);
  if (!Number.isFinite(claimedMs)) return false;
  return Date.now() - claimedMs < SCAN_CLAIM_TTL_MS;
}

export async function inspectPaidSession(
  sessionId: string | undefined | null
): Promise<PaidUnlockInspectResult> {
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return { status: "missing", error: "Valid sessionId is required" };
  }
  if (!getStripe()) {
    return { status: "unavailable", error: "Stripe not configured" };
  }
  const result = await verifyPaidCheckoutSession(sessionId);
  if (!result.paid) {
    if (result.error?.toLowerCase().includes("not configured")) {
      return { status: "unavailable", error: result.error };
    }
    return { status: "missing", error: result.error };
  }
  if (result.consumed) return { status: "spent" };
  return { status: "valid" };
}

/**
 * Server-side: session is paid and not yet used for a full scan.
 * One checkout = one full-site scan.
 */
export async function verifyPaidSession(sessionId: string | undefined | null): Promise<boolean> {
  const result = await inspectPaidSession(sessionId);
  return result.status === "valid";
}

/**
 * Atomically claim a paid unlock for one full-site scan via Checkout metadata.
 * Stale leases (crashed / timed-out crawls) can be reclaimed.
 */
export async function claimPaidSession(sessionId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe || !sessionId.startsWith("cs_")) return false;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return false;
  if (session.metadata?.app !== "seohub" || session.metadata?.product !== "full_seo_scan") {
    return false;
  }
  if (session.metadata?.consumed === "1") return false;
  if (claimIsActive(session.metadata?.scanClaimedAt)) return false;

  const claimedAt = new Date().toISOString();
  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      ...(session.metadata || {}),
      app: session.metadata?.app || "seohub",
      product: session.metadata?.product || "full_seo_scan",
      scanClaimedAt: claimedAt,
    },
  });

  // Re-read to reduce (not eliminate) races between two claimers.
  const again = await stripe.checkout.sessions.retrieve(sessionId);
  return again.metadata?.scanClaimedAt === claimedAt && again.metadata?.consumed !== "1";
}

/** Release a scan lease after a failed crawl so the unlock can be retried. */
export async function releasePaidSessionClaim(sessionId: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe || !sessionId.startsWith("cs_")) return;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return;
  if (session.metadata?.consumed === "1") return;
  if (!session.metadata?.scanClaimedAt) return;

  const { scanClaimedAt: _drop, ...rest } = session.metadata || {};
  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      ...rest,
      app: session.metadata?.app || "seohub",
      product: session.metadata?.product || "full_seo_scan",
      scanClaimedAt: "",
    },
  });
}

/** Mark a Checkout session as used after a successful full scan. */
export async function consumePaidSession(sessionId: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe || !sessionId.startsWith("cs_")) return;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return;
  if (session.metadata?.consumed === "1") return;

  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      ...(session.metadata || {}),
      app: session.metadata?.app || "seohub",
      product: session.metadata?.product || "full_seo_scan",
      consumed: "1",
      consumedAt: new Date().toISOString(),
      scanClaimedAt: "",
    },
  });
}

/**
 * One checkout may promote at most one stashed preview to a full report.
 * Full-site crawl still uses {@link consumePaidSession}.
 */
export async function markPaidPreviewUnlock(sessionId: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe || !sessionId.startsWith("cs_")) return false;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return false;
  if (session.metadata?.consumed === "1") return false;
  if (session.metadata?.previewUnlocked === "1") return false;

  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      ...(session.metadata || {}),
      app: session.metadata?.app || "seohub",
      product: session.metadata?.product || "full_seo_scan",
      previewUnlocked: "1",
      previewUnlockedAt: new Date().toISOString(),
    },
  });
  return true;
}

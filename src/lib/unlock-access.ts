import {
  consumePaidSession,
  verifyPaidCheckoutSession,
  verifyPaidSession,
} from "@/lib/stripe-unlock-server";
import {
  consumePromoSession,
  isPromoSessionId,
  promoSessionExists,
  verifyPromoSession,
} from "@/lib/promo-codes";

/** Unused Stripe or promo session — can run one full-site crawl. */
export async function verifyUnlockSession(
  sessionId: string | undefined | null
): Promise<boolean> {
  if (!sessionId) return false;
  if (isPromoSessionId(sessionId)) return verifyPromoSession(sessionId);
  return verifyPaidSession(sessionId);
}

/** Paid or promo access for AI / post-scan features (consumed sessions OK). */
export async function verifyUnlockAccess(
  sessionId: string | undefined | null
): Promise<boolean> {
  if (!sessionId) return false;
  if (isPromoSessionId(sessionId)) return promoSessionExists(sessionId);
  const paid = await verifyPaidCheckoutSession(sessionId);
  return Boolean(paid.paid);
}

export async function consumeUnlockSession(sessionId: string): Promise<void> {
  if (isPromoSessionId(sessionId)) {
    await consumePromoSession(sessionId);
    return;
  }
  await consumePaidSession(sessionId);
}

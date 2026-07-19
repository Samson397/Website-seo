import {
  claimPaidSession,
  consumePaidSession,
  inspectPaidSession,
  markPaidPreviewUnlock,
  releasePaidSessionClaim,
  verifyPaidCheckoutSession,
  verifyPaidSession,
} from "@/lib/stripe-unlock-server";
import {
  claimPromoSession,
  consumePromoSession,
  inspectPromoSession,
  isPromoSessionId,
  markPromoPreviewUnlock,
  promoSessionExists,
  releasePromoSessionClaim,
  verifyPromoSession,
} from "@/lib/promo-codes";

export type UnlockSessionStatus = "valid" | "spent" | "missing" | "unavailable";

export interface UnlockInspect {
  status: UnlockSessionStatus;
  error: string;
}

function messageForStatus(status: UnlockSessionStatus, kind: "payment" | "promo"): string {
  if (status === "spent") {
    return kind === "promo"
      ? "This promo code was already used for a full scan. Redeem a new code, pay again, or run a free homepage preview."
      : "This payment was already used for a full scan. Pay again, redeem a new code, or run a free homepage preview.";
  }
  if (status === "unavailable") {
    return kind === "promo"
      ? "Promo unlocks are temporarily unavailable. Try again in a moment, or pay for a full scan."
      : "Payment verification is temporarily unavailable. Try again in a moment.";
  }
  return kind === "promo"
    ? "This promo unlock could not be verified. Redeem a new code, pay again, or run a free homepage preview."
    : "This payment could not be verified. Pay again, redeem a new code, or run a free homepage preview.";
}

/** Inspect Stripe or promo session without claiming it. */
export async function inspectUnlockSession(
  sessionId: string | undefined | null
): Promise<UnlockInspect> {
  if (!sessionId) {
    return { status: "missing", error: messageForStatus("missing", "payment") };
  }
  if (isPromoSessionId(sessionId)) {
    const result = await inspectPromoSession(sessionId);
    return { status: result.status, error: messageForStatus(result.status, "promo") };
  }
  const result = await inspectPaidSession(sessionId);
  const detail = "error" in result ? result.error : undefined;
  return {
    status: result.status,
    error: detail || messageForStatus(result.status, "payment"),
  };
}

/** Unused Stripe or promo session — can run one full-site crawl. */
export async function verifyUnlockSession(
  sessionId: string | undefined | null
): Promise<boolean> {
  if (!sessionId) return false;
  if (isPromoSessionId(sessionId)) return verifyPromoSession(sessionId);
  return verifyPaidSession(sessionId);
}

/**
 * Atomically claim a session for one in-flight full scan.
 * Call {@link releaseUnlockSessionClaim} if the crawl fails.
 */
export async function claimUnlockSession(
  sessionId: string | undefined | null
): Promise<UnlockInspect> {
  if (!sessionId) {
    return { status: "missing", error: messageForStatus("missing", "payment") };
  }

  if (isPromoSessionId(sessionId)) {
    const before = await inspectPromoSession(sessionId);
    if (before.status !== "valid") {
      return { status: before.status, error: messageForStatus(before.status, "promo") };
    }
    const claimed = await claimPromoSession(sessionId);
    if (!claimed) {
      // Another request won the race, or the session was just spent.
      const again = await inspectPromoSession(sessionId);
      const status = again.status === "valid" ? "spent" : again.status;
      return {
        status,
        error:
          status === "spent"
            ? "This promo unlock is already running a full scan, or was already used. Wait for it to finish, or redeem a new code."
            : messageForStatus(status, "promo"),
      };
    }
    return { status: "valid", error: "" };
  }

  const before = await inspectPaidSession(sessionId);
  if (before.status !== "valid") {
    const detail = "error" in before ? before.error : undefined;
    return {
      status: before.status,
      error: detail || messageForStatus(before.status, "payment"),
    };
  }
  const claimed = await claimPaidSession(sessionId);
  if (!claimed) {
    const again = await inspectPaidSession(sessionId);
    const status = again.status === "valid" ? "spent" : again.status;
    const detail = "error" in again ? again.error : undefined;
    return {
      status,
      error:
        status === "spent"
          ? "This payment is already running a full scan, or was already used. Wait for it to finish, or pay again."
          : detail || messageForStatus(status, "payment"),
    };
  }
  return { status: "valid", error: "" };
}

export async function releaseUnlockSessionClaim(sessionId: string): Promise<void> {
  if (isPromoSessionId(sessionId)) {
    await releasePromoSessionClaim(sessionId);
    return;
  }
  await releasePaidSessionClaim(sessionId);
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

/** Bind a session to a single preview promote (before full-crawl consume). */
export async function markPreviewUnlockSession(sessionId: string): Promise<boolean> {
  if (isPromoSessionId(sessionId)) return markPromoPreviewUnlock(sessionId);
  return markPaidPreviewUnlock(sessionId);
}

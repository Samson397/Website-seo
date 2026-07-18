/** Client-safe Stripe display helpers (no secret keys). */
export const FULL_SCAN_PRICE_LABEL =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_DISPLAY || "$0.99";

/**
 * Prefer runtime /api/stripe/status.
 * Fallback: publishable key present at build time.
 */
export function paymentsEnabledClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

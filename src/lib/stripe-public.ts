/** Client-safe Stripe display helpers (no secret keys). */
export const FULL_SCAN_PRICE_LABEL =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_DISPLAY || "$1.99";

export function paymentsEnabledClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

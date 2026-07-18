import Stripe from "stripe";
import { sanitizePriceLabel } from "@/lib/price-label";

export const FULL_SCAN_PRICE_CENTS = 99;
export const FULL_SCAN_PRICE_LABEL = sanitizePriceLabel(
  process.env.NEXT_PUBLIC_STRIPE_PRICE_DISPLAY
);

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  // Publishable key is optional for redirect Checkout, but keep status honest for UI.
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export function getStripePriceId(): string | null {
  return process.env.STRIPE_PRICE_ID || null;
}

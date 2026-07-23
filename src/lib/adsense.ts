/**
 * Google AdSense publisher (public client id).
 * Override with NEXT_PUBLIC_ADSENSE_CLIENT when needed.
 * Auto ads load via next/script lazyOnload in the root layout (meta tag still verifies the site).
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "ca-pub-4587075434685102";

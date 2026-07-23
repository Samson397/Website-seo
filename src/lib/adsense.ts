/**
 * Google AdSense publisher (public client id).
 * Override with NEXT_PUBLIC_ADSENSE_CLIENT when needed.
 * Auto ads load via consent-gated AdSense client component.
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "ca-pub-4587075434685102";

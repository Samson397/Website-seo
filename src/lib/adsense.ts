/**
 * Google AdSense publisher (public client id).
 * Override with NEXT_PUBLIC_ADSENSE_CLIENT when needed.
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "ca-pub-4587075434685102";

export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim() || "";

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

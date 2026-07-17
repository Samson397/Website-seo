/** Canonical production host for SEOHub (custom domain). */
export const PRODUCTION_SITE_URL = "https://www.seohub.online";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isVercelAppHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".vercel.app");
  } catch {
    return url.includes("vercel.app");
  }
}

/**
 * Public site origin for canonicals, sitemap, OG, JSON-LD, and Stripe returns.
 * In production, never emit a stale *.vercel.app host when the custom domain is live.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
    ? stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL)
    : null;

  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    if (configured && !isVercelAppHost(configured)) {
      return configured;
    }
    return PRODUCTION_SITE_URL;
  }

  if (configured) {
    return configured;
  }

  if (process.env.VERCEL_URL) {
    return `https://${stripTrailingSlash(process.env.VERCEL_URL.replace(/^https?:\/\//, ""))}`;
  }

  return "http://localhost:3000";
}

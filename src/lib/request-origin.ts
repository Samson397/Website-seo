import { NextRequest } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Origin for Stripe return URLs.
 * Prefer configured site URL in production; fall back to the live request host for previews.
 */
export function getRequestOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured && process.env.NODE_ENV === "production") {
    return configured;
  }

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.headers.get("host")?.split(",")[0]?.trim();
  const protoHeader = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = protoHeader || (host?.includes("localhost") ? "http" : "https");

  if (host && !host.includes("..")) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return getSiteUrl();
}

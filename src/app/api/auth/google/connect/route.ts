import { NextResponse } from "next/server";
import {
  OAUTH_INTENT_COOKIE,
  OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  createOAuthState,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Optional user Connect Google (Search Console) — not limited to admin emails. */
export async function GET() {
  const base = getSiteUrl();
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/connect/google?error=" + encodeURIComponent("Google OAuth is not configured."),
        base
      )
    );
  }

  const state = createOAuthState();
  const res = NextResponse.redirect(buildGoogleAuthUrl(state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set(OAUTH_INTENT_COOKIE, "user", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

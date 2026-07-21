import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_INTENT_COOKIE,
  OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  createOAuthState,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";
import { isAdminConfigured, isAdminRequest } from "@/lib/admin-auth";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Start Google OAuth to link Analytics/Search Console for admin data tabs.
 * Admin must already be signed in with ADMIN_SECRET — Google is not a login method.
 */
export async function GET(req: NextRequest) {
  const base = getSiteUrl();
  if (!isAdminConfigured()) {
    return NextResponse.redirect(
      new URL("/admin?google_error=" + encodeURIComponent("Admin secret not configured."), base)
    );
  }
  if (!isAdminRequest(req)) {
    return NextResponse.redirect(
      new URL(
        "/admin?google_error=" +
          encodeURIComponent("Sign in with ADMIN_SECRET first, then connect Google."),
        base
      )
    );
  }
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/admin?google_error=" +
          encodeURIComponent("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."),
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
  res.cookies.set(OAUTH_INTENT_COOKIE, "admin", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  createOAuthState,
  getGoogleAdminEmails,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";
import { isAdminConfigured } from "@/lib/admin-auth";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const base = getSiteUrl();
  if (!isAdminConfigured()) {
    return NextResponse.redirect(
      new URL("/admin?google_error=" + encodeURIComponent("Admin secret not configured."), base)
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
  if (getGoogleAdminEmails().length === 0) {
    return NextResponse.redirect(
      new URL(
        "/admin?google_error=" +
          encodeURIComponent("Set GOOGLE_ADMIN_EMAILS to your Google account email."),
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
  return res;
}

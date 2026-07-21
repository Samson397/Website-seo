import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  getAdminSecret,
  isAdminConfigured,
} from "@/lib/admin-auth";
import {
  GOOGLE_RT_COOKIE,
  OAUTH_STATE_COOKIE,
  exchangeCodeForTokens,
  fetchGoogleUserEmail,
  getGoogleRedirectUri,
  isGoogleAdminEmail,
  isGoogleOAuthConfigured,
  sealRefreshToken,
  verifyOAuthState,
} from "@/lib/google-oauth";
import { getSiteUrl } from "@/lib/site-url";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function adminUrl(query?: Record<string, string>): string {
  const base = `${getSiteUrl()}/admin`;
  if (!query || Object.keys(query).length === 0) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

export async function GET(req: NextRequest) {
  const ip = clientKeyFromRequest(req);
  const limited = rateLimit(`admin:google:${ip}`, { limit: 20, windowMs: 15 * 60_000 });
  if (!limited.ok) {
    return NextResponse.redirect(
      adminUrl({ google_error: "Too many attempts. Try again later." })
    );
  }

  if (!isAdminConfigured() || !isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      adminUrl({ google_error: "Google sign-in is not configured." })
    );
  }

  const url = req.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      adminUrl({ google_error: error === "access_denied" ? "Google sign-in cancelled." : error })
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !verifyOAuthState(state, stateCookie)) {
    return NextResponse.redirect(adminUrl({ google_error: "Invalid OAuth state. Try again." }));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchGoogleUserEmail(tokens.access_token);
    if (!email) {
      return NextResponse.redirect(
        adminUrl({ google_error: "Could not read a verified Google email." })
      );
    }
    if (!isGoogleAdminEmail(email)) {
      return NextResponse.redirect(
        adminUrl({
          google_error: `${email} is not in GOOGLE_ADMIN_EMAILS.`,
        })
      );
    }

    const res = NextResponse.redirect(adminUrl({ google: "1" }));
    res.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), adminCookieOptions());
    res.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    if (tokens.refresh_token) {
      const sealed = sealRefreshToken(tokens.refresh_token, getAdminSecret());
      res.cookies.set(GOOGLE_RT_COOKIE, sealed, {
        ...adminCookieOptions(60 * 60 * 24 * 30),
      });
    }

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google sign-in failed";
    console.error("[google-oauth]", message, "redirect_uri=", getGoogleRedirectUri());
    return NextResponse.redirect(adminUrl({ google_error: message }));
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  adminCookieOptions,
  getAdminSecret,
  isAdminConfigured,
  isAdminRequest,
} from "@/lib/admin-auth";
import {
  GOOGLE_RT_COOKIE,
  OAUTH_INTENT_COOKIE,
  OAUTH_STATE_COOKIE,
  USER_GOOGLE_RT_COOKIE,
  exchangeCodeForTokens,
  fetchGoogleUserEmail,
  getGoogleAdminEmails,
  getGoogleRedirectUri,
  isGoogleAdminEmail,
  isGoogleOAuthConfigured,
  sealRefreshToken,
  sealSecretForIntent,
  verifyOAuthState,
  type GoogleOAuthIntent,
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

function userConnectUrl(query?: Record<string, string>): string {
  const base = `${getSiteUrl()}/connect/google`;
  if (!query || Object.keys(query).length === 0) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

function clearOAuthCookies(res: NextResponse) {
  res.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(OAUTH_INTENT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Google OAuth callback.
 * - Admin intent: requires an existing ADMIN_SECRET session. Stores Google refresh token only
 *   (Google is not an admin login method).
 * - User intent: stores a user Google cookie for optional GSC page insights.
 */
export async function GET(req: NextRequest) {
  const ip = clientKeyFromRequest(req);
  const limited = rateLimit(`google:oauth:${ip}`, { limit: 30, windowMs: 15 * 60_000 });
  const intent = (req.cookies.get(OAUTH_INTENT_COOKIE)?.value === "user" ? "user" : "admin") as GoogleOAuthIntent;
  const fail = (message: string) =>
    NextResponse.redirect(
      intent === "user" ? userConnectUrl({ error: message }) : adminUrl({ google_error: message })
    );

  if (!limited.ok) {
    return fail("Too many attempts. Try again later.");
  }

  if (!isGoogleOAuthConfigured()) {
    return fail("Google connect is not configured.");
  }

  if (intent === "admin" && !isAdminConfigured()) {
    return fail("Admin secret not configured.");
  }

  const url = req.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    return fail(error === "access_denied" ? "Google connect cancelled." : error);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !verifyOAuthState(state, stateCookie)) {
    return fail("Invalid OAuth state. Try again.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchGoogleUserEmail(tokens.access_token);
    if (!email) {
      return fail("Could not read a verified Google email.");
    }

    if (intent === "admin") {
      // Must already be signed in with ADMIN_SECRET — do not create an admin session here.
      if (!isAdminRequest(req)) {
        const res = fail("Sign in with your admin code first, then connect Google.");
        clearOAuthCookies(res);
        return res;
      }

      // Optional allowlist: if GOOGLE_ADMIN_EMAILS is set, enforce it; otherwise any account works.
      if (getGoogleAdminEmails().length > 0 && !isGoogleAdminEmail(email)) {
        const res = fail(`${email} is not in GOOGLE_ADMIN_EMAILS.`);
        clearOAuthCookies(res);
        return res;
      }

      if (!tokens.refresh_token) {
        const res = fail("Google did not return a refresh token. Reconnect and grant consent.");
        clearOAuthCookies(res);
        return res;
      }

      const res = NextResponse.redirect(adminUrl({ google: "1" }));
      clearOAuthCookies(res);
      const sealed = sealRefreshToken(tokens.refresh_token, getAdminSecret());
      res.cookies.set(GOOGLE_RT_COOKIE, sealed, {
        ...adminCookieOptions(60 * 60 * 24 * 30),
      });
      return res;
    }

    // User Connect Google (Search Console / optional Analytics)
    const res = NextResponse.redirect(userConnectUrl({ ok: "1", email }));
    clearOAuthCookies(res);
    if (tokens.refresh_token) {
      const sealed = sealRefreshToken(tokens.refresh_token, sealSecretForIntent("user"));
      res.cookies.set(USER_GOOGLE_RT_COOKIE, sealed, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google connect failed";
    console.error("[google-oauth]", message, "redirect_uri=", getGoogleRedirectUri());
    return fail(message);
  }
}

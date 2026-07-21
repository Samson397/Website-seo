import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { fetchGscSummary } from "@/lib/gsc";
import {
  USER_GOOGLE_RT_COOKIE,
  isGoogleOAuthConfigured,
  openRefreshToken,
  sealSecretForIntent,
} from "@/lib/google-oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ connected: false, error: "Google OAuth not configured" });
  }

  const sealed = req.cookies.get(USER_GOOGLE_RT_COOKIE)?.value;
  const refresh = sealed ? openRefreshToken(sealed, sealSecretForIntent("user")) : null;
  if (!refresh) {
    return NextResponse.json({
      connected: false,
      connectUrl: "/api/auth/google/connect",
    });
  }

  const site = req.nextUrl.searchParams.get("url") || "";
  if (!site) {
    return NextResponse.json({
      connected: true,
      needsUrl: true,
    });
  }

  try {
    await validateUrlSafe(site);
    const summary = await fetchGscSummary({
      oauthRefreshToken: refresh,
      preferredSiteUrl: normalizeUrl(site),
    });
    return NextResponse.json({
      connected: true,
      ...summary,
    });
  } catch (e) {
    return NextResponse.json({
      connected: true,
      error: e instanceof Error ? e.message : "Search Console failed",
    });
  }
}

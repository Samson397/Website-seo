import { NextRequest, NextResponse } from "next/server";
import { getAdminSecret, isAdminRequest } from "@/lib/admin-auth";
import { fetchGscSummary, getGscSiteUrl } from "@/lib/gsc";
import { GOOGLE_RT_COOKIE, isGoogleOAuthConfigured, openRefreshToken } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sealed = req.cookies.get(GOOGLE_RT_COOKIE)?.value;
  const oauthRefreshToken = sealed ? openRefreshToken(sealed, getAdminSecret()) : null;

  const summary = await fetchGscSummary({ oauthRefreshToken });

  return NextResponse.json({
    ...summary,
    preferredSiteUrl: getGscSiteUrl(),
    oauthConfigured: isGoogleOAuthConfigured(),
    hasOauthRefresh: Boolean(oauthRefreshToken),
  });
}

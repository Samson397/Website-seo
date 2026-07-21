import { NextRequest, NextResponse } from "next/server";
import { getAdminSecret, isAdminRequest } from "@/lib/admin-auth";
import { fetchGa4Summary, getGa4MeasurementId, getGa4PropertyId, isGa4DataApiConfigured } from "@/lib/ga4";
import { GOOGLE_RT_COOKIE, openRefreshToken } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sealed = req.cookies.get(GOOGLE_RT_COOKIE)?.value;
  const oauthRefreshToken = sealed ? openRefreshToken(sealed, getAdminSecret()) : null;

  const summary = await fetchGa4Summary({ oauthRefreshToken });

  return NextResponse.json({
    ...summary,
    measurementIdConfigured: Boolean(getGa4MeasurementId()),
    measurementId: getGa4MeasurementId() ? `${getGa4MeasurementId().slice(0, 4)}…` : null,
    propertyIdConfigured: Boolean(getGa4PropertyId()),
    dataApiReady: isGa4DataApiConfigured() || Boolean(oauthRefreshToken && getGa4PropertyId()),
    hasOauthRefresh: Boolean(oauthRefreshToken),
  });
}

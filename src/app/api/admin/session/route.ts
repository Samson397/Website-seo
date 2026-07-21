import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, isAdminRequest } from "@/lib/admin-auth";
import { canUsePromoCodes } from "@/lib/promo-codes";
import { canUseBlogDb } from "@/lib/blog-db";
import { canUseVisitorAnalytics } from "@/lib/visitor-analytics";
import { getGa4MeasurementId, getGa4PropertyId, isGa4DataApiConfigured } from "@/lib/ga4";
import { isGoogleOAuthConfigured } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated: isAdminRequest(req),
    database: canUsePromoCodes() || canUseBlogDb() || canUseVisitorAnalytics(),
    promoDb: canUsePromoCodes(),
    blogDb: canUseBlogDb(),
    analyticsDb: canUseVisitorAnalytics(),
    // Client id/secret only — Google is connected after ADMIN_SECRET login, not used as login.
    googleOAuth: isGoogleOAuthConfigured(),
    gaMeasurement: Boolean(getGa4MeasurementId()),
    gaDataApi: isGa4DataApiConfigured() || Boolean(getGa4PropertyId()),
  });
}

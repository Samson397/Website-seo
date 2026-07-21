import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, isAdminRequest } from "@/lib/admin-auth";
import { canUsePromoCodes } from "@/lib/promo-codes";
import { canUseBlogDb } from "@/lib/blog-db";
import { canUseVisitorAnalytics } from "@/lib/visitor-analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated: isAdminRequest(req),
    database: canUsePromoCodes() || canUseBlogDb() || canUseVisitorAnalytics(),
    promoDb: canUsePromoCodes(),
    blogDb: canUseBlogDb(),
    analyticsDb: canUseVisitorAnalytics(),
  });
}

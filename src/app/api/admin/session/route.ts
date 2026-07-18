import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, isAdminRequest } from "@/lib/admin-auth";
import { canUsePromoCodes } from "@/lib/promo-codes";
import { canUseBlogDb } from "@/lib/blog-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated: isAdminRequest(req),
    database: canUsePromoCodes() || canUseBlogDb(),
    promoDb: canUsePromoCodes(),
    blogDb: canUseBlogDb(),
  });
}

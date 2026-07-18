import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { listRecentCheckoutsAdmin } from "@/lib/stripe-admin";
import { listPromoUnlocksAdmin } from "@/lib/promo-codes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [stripe, promoUnlocks] = await Promise.all([
      listRecentCheckoutsAdmin(40),
      listPromoUnlocksAdmin(40),
    ]);
    return NextResponse.json({
      stripe,
      promoUnlocks,
    });
  } catch (err) {
    console.error("[admin/payments]", err);
    return NextResponse.json({ error: "Could not load payments." }, { status: 500 });
  }
}

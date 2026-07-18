import { NextResponse } from "next/server";
import { canUsePromoCodes, listPublicPromoCodes } from "@/lib/promo-codes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public list of promo codes with live used / remaining counts. */
export async function GET() {
  if (!canUsePromoCodes()) {
    return NextResponse.json({
      enabled: false,
      codes: [],
      message: "Promo codes require Neon (DATABASE_URL).",
    });
  }

  try {
    const codes = await listPublicPromoCodes();
    return NextResponse.json({
      enabled: true,
      codes,
    });
  } catch (err) {
    console.error("[promo]", err);
    return NextResponse.json(
      { enabled: false, codes: [], error: "Could not load promo codes." },
      { status: 500 }
    );
  }
}

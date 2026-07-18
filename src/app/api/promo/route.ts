import { NextResponse } from "next/server";
import { canUsePromoCodes, listPublicPromoCodes } from "@/lib/promo-codes";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

/** Public list of promo codes with live used / remaining counts. */
export async function GET() {
  if (!canUsePromoCodes()) {
    return NextResponse.json(
      {
        enabled: false,
        codes: [],
        message: "Promo codes require Neon (DATABASE_URL).",
      },
      { headers: NO_STORE }
    );
  }

  try {
    const codes = await listPublicPromoCodes();
    return NextResponse.json(
      {
        enabled: true,
        codes,
        fetchedAt: new Date().toISOString(),
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[promo]", err);
    return NextResponse.json(
      { enabled: false, codes: [], error: "Could not load promo codes." },
      { status: 500, headers: NO_STORE }
    );
  }
}

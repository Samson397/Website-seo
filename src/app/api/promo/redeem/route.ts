import { NextRequest, NextResponse } from "next/server";
import { redeemPromoCode } from "@/lib/promo-codes";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Redeem WELCOME (or configured) code — 1 per IP, shared first-100 pool. */
export async function POST(request: NextRequest) {
  const ip = clientKeyFromRequest(request);
  const limited = rateLimit(`promo:redeem:${ip}`, {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let code: string | undefined;
  try {
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Promo code is required." }, { status: 400 });
  }

  const result = await redeemPromoCode(code, ip);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    sessionId: result.sessionId,
    code: result.code,
    usedCount: result.usedCount,
    maxUses: result.maxUses,
    remaining: result.remaining,
  });
}

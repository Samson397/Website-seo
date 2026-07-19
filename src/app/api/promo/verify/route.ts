import { NextRequest, NextResponse } from "next/server";
import { inspectUnlockSession } from "@/lib/unlock-access";
import { isPromoSessionId } from "@/lib/promo-codes";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Confirm a promo unlock session is still usable for one full-site scan. */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`promo:verify:${clientKeyFromRequest(req)}`, {
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let sessionId: string | undefined;
  try {
    const body = await req.json();
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!sessionId || !isPromoSessionId(sessionId)) {
    return NextResponse.json(
      { ok: false, paid: false, error: "Valid promo sessionId is required" },
      { status: 400 }
    );
  }

  const inspected = await inspectUnlockSession(sessionId);
  if (inspected.status !== "valid") {
    return NextResponse.json(
      {
        ok: false,
        paid: false,
        consumed: inspected.status === "spent",
        code: inspected.status === "spent" ? "unlock_spent" : "unlock_invalid",
        error: inspected.error,
      },
      { status: inspected.status === "unavailable" ? 503 : 402 }
    );
  }

  return NextResponse.json({
    ok: true,
    paid: true,
    sessionId,
    scansRemaining: 1,
  });
}

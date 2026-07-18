import { NextRequest, NextResponse } from "next/server";
import { isDeepSeekConfigured } from "@/lib/deepseek";
import { generateAiFixPlan } from "@/lib/ai-fix-plan";
import { verifyUnlockAccess } from "@/lib/unlock-access";
import { isStripeConfigured } from "@/lib/stripe";
import { isPromoSessionId } from "@/lib/promo-codes";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import type { AuditReport } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generate an AI fix plan for a paid full report.
 * Requires a paid Stripe session (consumed OK — plan is part of that scan).
 */
export async function POST(request: NextRequest) {
  if (!isDeepSeekConfigured()) {
    return NextResponse.json(
      { error: "AI fix plans are not configured (missing DEEPSEEK_API_KEY)." },
      { status: 503 }
    );
  }

  const limited = rateLimit(`ai:fix-plan:${clientKeyFromRequest(request)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${limited.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let report: AuditReport | undefined;
  let sessionId: string | undefined;
  try {
    const body = await request.json();
    report = body?.report as AuditReport | undefined;
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!report?.url || !report.scores || !Array.isArray(report.issues)) {
    return NextResponse.json({ error: "A full audit report is required." }, { status: 400 });
  }

  if (report.tier && report.tier !== "full") {
    return NextResponse.json(
      { error: "AI fix plans are included with a paid full scan only." },
      { status: 402 }
    );
  }

  if (isStripeConfigured() || (sessionId && isPromoSessionId(sessionId))) {
    if (!sessionId) {
      return NextResponse.json(
        { error: "Paid session or promo unlock required to generate an AI fix plan." },
        { status: 402 }
      );
    }
    // Consumed sessions are allowed — the plan belongs to that scan.
    const ok = await verifyUnlockAccess(sessionId);
    if (!ok) {
      return NextResponse.json(
        { error: "Payment or promo could not be verified." },
        { status: 402 }
      );
    }
  }

  try {
    const plan = await generateAiFixPlan(report);
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[ai/fix-plan]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI fix plan failed" },
      { status: 502 }
    );
  }
}

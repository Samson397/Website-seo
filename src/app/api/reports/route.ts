import { NextRequest, NextResponse } from "next/server";
import { canPersistReports, saveSharedReport } from "@/lib/reports";
import type { AuditReport } from "@/lib/types";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { verifyUnlockAccess } from "@/lib/unlock-access";

export async function POST(request: NextRequest) {
  try {
    if (!canPersistReports()) {
      return NextResponse.json(
        { error: "Sharing requires Neon / DATABASE_URL on the server." },
        { status: 503 }
      );
    }

    const limited = rateLimit(`share:${clientKeyFromRequest(request)}`, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many share requests" }, { status: 429 });
    }

    const body = await request.json();
    const report = body?.report as AuditReport | undefined;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;
    if (!report?.url || !report?.scores || !Array.isArray(report.issues)) {
      return NextResponse.json({ error: "Valid report is required" }, { status: 400 });
    }
    if (report.tier !== "full") {
      return NextResponse.json(
        { error: "Shareable links require a full SEO unlock." },
        { status: 402 }
      );
    }

    // Prefer an existing server share id from a paid crawl; otherwise require session proof.
    if (!report.shareId) {
      const allowed = await verifyUnlockAccess(sessionId);
      if (!allowed) {
        return NextResponse.json(
          { error: "A verified payment or promo session is required to create a share link." },
          { status: 402 }
        );
      }
    }

    const id = report.shareId || (await saveSharedReport(report));
    return NextResponse.json({ id, path: `/r/${id}` });
  } catch (err) {
    console.error("[reports]", err);
    return NextResponse.json({ error: "Could not save report" }, { status: 500 });
  }
}

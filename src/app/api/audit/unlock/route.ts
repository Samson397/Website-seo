import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { verifyPaidSession } from "@/lib/stripe-unlock-server";
import {
  canPersistReports,
  getPreviewReport,
  promotePreviewToShared,
} from "@/lib/reports";

export const runtime = "nodejs";

/**
 * Unlock a stashed free-preview report in place (no re-crawl).
 * Body: { previewId, sessionId }
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }
  if (!canPersistReports()) {
    return NextResponse.json(
      { error: "Report stash unavailable. Run a full scan after unlock instead." },
      { status: 503 }
    );
  }

  let previewId: string | undefined;
  let sessionId: string | undefined;
  try {
    const body = await request.json();
    previewId = typeof body?.previewId === "string" ? body.previewId : undefined;
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!previewId || !sessionId) {
    return NextResponse.json({ error: "previewId and sessionId are required" }, { status: 400 });
  }

  const paid = await verifyPaidSession(sessionId);
  if (!paid) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 402 });
  }

  const stashed = await getPreviewReport(previewId);
  if (!stashed) {
    return NextResponse.json(
      { error: "Preview expired. Run a new scan — unlock still works for a full crawl." },
      { status: 404 }
    );
  }

  const report = await promotePreviewToShared(previewId, stashed);
  return NextResponse.json({ report, shareId: report.shareId });
}

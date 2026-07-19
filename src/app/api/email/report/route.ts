import { NextRequest, NextResponse } from "next/server";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { reportEmailHtml } from "@/lib/email-templates";
import { canPersistReports, saveSharedReport } from "@/lib/reports";
import { getSiteUrl } from "@/lib/site-url";
import type { AuditReport } from "@/lib/types";
import { isValidEmail } from "@/lib/digest";
import { verifyUnlockAccess } from "@/lib/unlock-access";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL." },
        { status: 503 }
      );
    }

    const limited = rateLimit(`email:report:${clientKeyFromRequest(req)}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many email requests." }, { status: 429 });
    }

    const body = (await req.json()) as {
      email?: string;
      report?: AuditReport;
      sessionId?: string;
    };
    const email = body.email?.trim() || "";
    const report = body.report;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!report?.url || !report.scores || !Array.isArray(report.issues)) {
      return NextResponse.json({ error: "Valid report is required." }, { status: 400 });
    }
    if (report.tier !== "full") {
      return NextResponse.json(
        { error: "Email reports require a full SEO unlock." },
        { status: 402 }
      );
    }

    const allowed = report.shareId
      ? true
      : await verifyUnlockAccess(sessionId);
    if (!allowed) {
      return NextResponse.json(
        { error: "A verified payment or promo session is required to email this report." },
        { status: 402 }
      );
    }

    let shareUrl: string | null = null;
    if (report.shareId) {
      shareUrl = `${getSiteUrl()}/r/${report.shareId}`;
    } else if (canPersistReports()) {
      try {
        const id = await saveSharedReport(report);
        report.shareId = id;
        shareUrl = `${getSiteUrl()}/r/${id}`;
      } catch (err) {
        console.error("[email/report] share save failed", err);
      }
    }

    const { subject, html, text } = reportEmailHtml({
      report,
      shareUrl,
      siteUrl: getSiteUrl(),
    });

    await sendEmail({ to: email, subject, html, text });

    return NextResponse.json({ ok: true, shareUrl });
  } catch (err) {
    console.error("[email/report]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send email" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { reportEmailHtml } from "@/lib/email-templates";
import { canPersistReports, saveSharedReport } from "@/lib/reports";
import { getSiteUrl } from "@/lib/site-url";
import type { AuditReport } from "@/lib/types";
import { isValidEmail } from "@/lib/digest";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isResendConfigured()) {
      return NextResponse.json(
        {
          error:
            "Email is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL (verified domain).",
        },
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

    const body = (await req.json()) as { email?: string; report?: AuditReport };
    const email = body.email?.trim() || "";
    const report = body.report;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!report?.url || !report.scores || !Array.isArray(report.issues)) {
      return NextResponse.json({ error: "Valid report is required." }, { status: 400 });
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

    const emailHash = createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16);
    const reportKey = report.shareId || createHash("sha256").update(report.url).digest("hex").slice(0, 12);
    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
      idempotencyKey: `audit-report/${reportKey}/${emailHash}`,
      tags: [
        { name: "category", value: "audit_report" },
        { name: "product", value: "seohub" },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: result.id, shareUrl });
  } catch (err) {
    // Network / unexpected failures only — Resend API errors return { data, error }.
    console.error("[email/report]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send email" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { reportEmailHtml } from "@/lib/email-templates";
import { canPersistReports, saveSharedReport } from "@/lib/reports";
import { getSiteUrl } from "@/lib/site-url";
import type { AiFixPlan } from "@/lib/ai-fix-plan-types";
import type { AuditReport } from "@/lib/types";
import { isValidEmail } from "@/lib/digest";
import { verifyUnlockAccess } from "@/lib/unlock-access";

export const runtime = "nodejs";

function sanitizePlan(raw: unknown): AiFixPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const priorityFixes = Array.isArray(obj.priorityFixes) ? obj.priorityFixes : [];
  const metaRewrites = Array.isArray(obj.metaRewrites) ? obj.metaRewrites : [];
  const issueRewrites = Array.isArray(obj.issueRewrites) ? obj.issueRewrites : [];
  const nextSteps = Array.isArray(obj.nextSteps) ? obj.nextSteps : [];

  return {
    executiveSummary: String(obj.executiveSummary || "").slice(0, 500),
    projectedScoreNote: String(obj.projectedScoreNote || "").slice(0, 220),
    priorityFixes: priorityFixes.slice(0, 5).map((item) => {
      const f = item as Record<string, unknown>;
      const impact = f.impact === "high" || f.impact === "low" ? f.impact : "medium";
      return {
        title: String(f.title || "Fix").slice(0, 120),
        why: String(f.why || "").slice(0, 280),
        action: String(f.action || "").slice(0, 320),
        impact,
      };
    }),
    metaRewrites: metaRewrites.slice(0, 5).map((item) => {
      const m = item as Record<string, unknown>;
      return {
        path: String(m.path || "/").slice(0, 120),
        currentTitle: String(m.currentTitle || "").slice(0, 120),
        suggestedTitle: String(m.suggestedTitle || "").slice(0, 70),
        currentDescription: String(m.currentDescription || "").slice(0, 200),
        suggestedDescription: String(m.suggestedDescription || "").slice(0, 160),
      };
    }),
    issueRewrites: issueRewrites.slice(0, 12).map((item) => {
      const i = item as Record<string, unknown>;
      return {
        issueId: String(i.issueId || "").slice(0, 80),
        plainEnglish: String(i.plainEnglish || "").slice(0, 280),
        action: String(i.action || "").slice(0, 280),
      };
    }),
    llmsTxtDraft: String(obj.llmsTxtDraft || "").slice(0, 1200),
    nextSteps: nextSteps.map((s) => String(s).slice(0, 160)).slice(0, 5),
  };
}

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
      plan?: unknown;
    };
    const email = body.email?.trim() || "";
    const report = body.report;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;
    const plan = sanitizePlan(body.plan);

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
      plan,
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

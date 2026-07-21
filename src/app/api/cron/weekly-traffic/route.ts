import { NextRequest, NextResponse } from "next/server";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { getSiteUrl } from "@/lib/site-url";
import {
  buildWeeklyTrafficDigestHtml,
  canUseVisitorAnalytics,
  getAnalyticsSettings,
} from "@/lib/visitor-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

/** Monday traffic digest for the site owner (Visitors tab settings). */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canUseVisitorAnalytics()) {
    return NextResponse.json({ ok: false, reason: "analytics_db_missing" });
  }
  if (!isResendConfigured()) {
    return NextResponse.json({ ok: false, reason: "resend_missing" });
  }

  const settings = await getAnalyticsSettings();
  if (!settings.digestEnabled || !settings.digestEmail) {
    return NextResponse.json({ ok: false, reason: "digest_disabled" });
  }

  try {
    const siteUrl = getSiteUrl();
    const digest = await buildWeeklyTrafficDigestHtml(siteUrl);
    await sendEmail({
      to: settings.digestEmail,
      subject: digest.subject,
      html: digest.html,
      text: digest.text,
    });
    return NextResponse.json({
      ok: true,
      to: settings.digestEmail,
      views7d: digest.summary.totals.views7d,
      unique7d: digest.summary.totals.unique7d,
    });
  } catch (err) {
    console.error("[cron/weekly-traffic]", err);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}

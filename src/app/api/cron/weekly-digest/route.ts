import { NextRequest, NextResponse } from "next/server";
import { listActiveDigests, markDigestSent, canPersistDigests } from "@/lib/digest";
import { digestEmailHtml } from "@/lib/email-templates";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

function weekBucket(d = new Date()): string {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  return start.toISOString().slice(0, 10);
}

/** Stay under Resend’s default 10 req/s team limit. */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Vercel Cron: send weekly watchlist digests via Resend. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canPersistDigests()) {
    return NextResponse.json({ error: "DATABASE_URL required" }, { status: 503 });
  }
  if (!isResendConfigured()) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 503 });
  }

  const siteUrl = getSiteUrl();
  const subs = await listActiveDigests();
  const week = weekBucket();
  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    if (!sub.sites.length) continue;
    try {
      const unsubUrl = `${siteUrl}/api/digest/unsubscribe?token=${sub.unsubToken}`;
      const { subject, html, text } = digestEmailHtml({
        sites: sub.sites,
        siteUrl,
        unsubUrl,
      });
      const result = await sendEmail({
        to: sub.email,
        subject,
        html,
        text,
        idempotencyKey: `weekly-digest/${sub.id}/${week}`,
        tags: [
          { name: "category", value: "weekly_digest" },
          { name: "product", value: "seohub" },
        ],
      });
      if (!result.ok) {
        failed += 1;
        console.error("[cron/weekly-digest]", sub.email, result.error);
      } else {
        await markDigestSent(sub.id);
        sent += 1;
      }
      await delay(120);
    } catch (err) {
      failed += 1;
      console.error("[cron/weekly-digest]", sub.email, err);
    }
  }

  return NextResponse.json({ ok: true, subscribers: subs.length, sent, failed });
}

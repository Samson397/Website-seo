import { NextRequest, NextResponse } from "next/server";
import {
  listActiveDigests,
  markDigestSent,
  canPersistDigests,
  updateDigestSites,
  type DigestSite,
} from "@/lib/digest";
import { digestEmailHtml } from "@/lib/email-templates";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { getSiteUrl } from "@/lib/site-url";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl } from "@/lib/fetcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

function overallFromScores(scores: {
  seo: number;
  performance: number;
  accessibility: number;
  security: number;
  ai?: number;
}): number {
  const parts = [
    scores.seo,
    scores.performance,
    scores.accessibility,
    scores.security,
    scores.ai,
  ].filter((n): n is number => typeof n === "number");
  return Math.round(parts.reduce((a, b) => a + b, 0) / Math.max(1, parts.length));
}

/** Homepage-only re-audit for digest sites (keeps cron under time budget). */
async function refreshSites(sites: DigestSite[]): Promise<DigestSite[]> {
  const refreshed: DigestSite[] = [];
  for (const site of sites.slice(0, 8)) {
    try {
      const report = await runFullAudit(normalizeUrl(site.url), { siteCrawl: false });
      const score = overallFromScores(report.scores);
      refreshed.push({
        ...site,
        previousOverall: site.lastOverall,
        lastOverall: score,
      });
    } catch (err) {
      console.error("[cron/weekly-digest] refresh failed", site.url, err);
      refreshed.push(site);
    }
  }
  // Keep any sites beyond the refresh cap unchanged
  if (sites.length > 8) refreshed.push(...sites.slice(8));
  return refreshed;
}

/** Vercel Cron: re-check watched homepages and email digests via Resend. */
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
  let sent = 0;
  let failed = 0;
  let refreshed = 0;

  for (const sub of subs) {
    if (!sub.sites.length) continue;
    try {
      const sites = await refreshSites(sub.sites);
      refreshed += sites.filter((s) => s.lastOverall != null).length;
      await updateDigestSites(sub.id, sites);

      const unsubUrl = `${siteUrl}/api/digest/unsubscribe?token=${sub.unsubToken}`;
      const { subject, html, text } = digestEmailHtml({
        sites,
        siteUrl,
        unsubUrl,
      });
      await sendEmail({ to: sub.email, subject, html, text });
      await markDigestSent(sub.id);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error("[cron/weekly-digest]", sub.email, err);
    }
  }

  return NextResponse.json({
    ok: true,
    subscribers: subs.length,
    sent,
    failed,
    sitesRefreshed: refreshed,
  });
}

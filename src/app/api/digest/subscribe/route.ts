import { NextRequest, NextResponse } from "next/server";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import {
  canPersistDigests,
  isValidEmail,
  upsertDigestSubscription,
  type DigestSite,
} from "@/lib/digest";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { getSiteUrl } from "@/lib/site-url";
import { APP_NAME } from "@/lib/brand";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!canPersistDigests()) {
      return NextResponse.json(
        { error: "Digest signup needs Neon / DATABASE_URL." },
        { status: 503 }
      );
    }

    const limited = rateLimit(`digest:sub:${clientKeyFromRequest(req)}`, {
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many signup attempts." }, { status: 429 });
    }

    const body = (await req.json()) as { email?: string; sites?: DigestSite[] };
    const email = body.email?.trim() || "";
    const sites = Array.isArray(body.sites) ? body.sites.slice(0, 20) : [];

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (sites.length === 0) {
      return NextResponse.json(
        { error: "Add at least one site to your watchlist first." },
        { status: 400 }
      );
    }

    const { unsubToken } = await upsertDigestSubscription(
      email,
      sites.map((s) => ({
        url: s.url,
        hostname: s.hostname,
        lastOverall: s.lastOverall,
      }))
    );

    const siteUrl = getSiteUrl();
    const unsubUrl = `${siteUrl}/api/digest/unsubscribe?token=${unsubToken}`;

    if (isResendConfigured()) {
      try {
        await sendEmail({
          to: email,
          subject: `${APP_NAME} weekly digest confirmed`,
          html: `<p>You're signed up for weekly watchlist reminders on ${APP_NAME}.</p>
            <p>We'll email you once a week with your watched sites.</p>
            <p><a href="${siteUrl}/history">Open History</a></p>
            <p style="font-size:12px;color:#666"><a href="${unsubUrl}">Unsubscribe</a></p>`,
          text: `Weekly digest confirmed on ${APP_NAME}. Unsubscribe: ${unsubUrl}`,
        });
      } catch (err) {
        console.error("[digest/subscribe] confirm email failed", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[digest/subscribe]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Subscribe failed" },
      { status: 500 }
    );
  }
}

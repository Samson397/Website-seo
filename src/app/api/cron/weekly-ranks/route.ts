import { NextRequest, NextResponse } from "next/server";
import {
  checkKeywordPosition,
  listActiveRankTracks,
  updateRankTrackCheck,
} from "@/lib/rank-tracking";
import { getDataForSeoCredentials } from "@/lib/dataforseo";
import { sendEmail, isResendConfigured } from "@/lib/resend";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getDataForSeoCredentials()) {
    return NextResponse.json({ ok: true, skipped: "DataForSEO not configured", checked: 0 });
  }

  const tracks = await listActiveRankTracks(60);
  const byEmail = new Map<string, Array<{ keyword: string; position: number | null; prev: number | null; url: string }>>();
  let checked = 0;

  for (const track of tracks) {
    try {
      const { position, rankingUrl } = await checkKeywordPosition(
        track.keyword,
        track.url,
        track.location_code || 2826
      );
      const prev = track.last_position;
      const history = [
        ...(Array.isArray(track.history) ? track.history : []),
        { at: new Date().toISOString(), position },
      ].slice(-30);
      await updateRankTrackCheck(track.id, position, rankingUrl, history);
      const list = byEmail.get(track.email) || [];
      list.push({ keyword: track.keyword, position, prev, url: track.url });
      byEmail.set(track.email, list);
      checked += 1;
    } catch (err) {
      console.error("[weekly-ranks]", track.id, err);
    }
  }

  let emails = 0;
  if (isResendConfigured()) {
    const emailEntries = Array.from(byEmail.entries());
    for (const [email, rows] of emailEntries) {
      const lines = rows
        .map(
          (r: { keyword: string; position: number | null; prev: number | null; url: string }) => {
          const arrow =
            r.prev == null || r.position == null
              ? "→"
              : r.position < r.prev
                ? "↑"
                : r.position > r.prev
                  ? "↓"
                  : "→";
          return `${r.keyword}: ${r.position ?? "n/a"} ${arrow} (was ${r.prev ?? "—"}) — ${r.url}`;
        }
        )
        .join("\n");
      try {
        await sendEmail({
          to: email,
          subject: "SEOHub weekly rank update",
          text: `Your tracked keywords:\n\n${lines}\n\n— SEOHub`,
          html: `<p>Your tracked keywords:</p><pre style="font-family:ui-monospace,monospace;white-space:pre-wrap">${lines
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")}</pre><p>— SEOHub</p>`,
        });
        emails += 1;
      } catch (err) {
        console.error("[weekly-ranks] email", email, err);
      }
    }
  }

  return NextResponse.json({ ok: true, checked, emails });
}

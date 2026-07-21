import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { canUseRankTracking, subscribeRankTrack } from "@/lib/rank-tracking";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!canUseRankTracking()) {
    return NextResponse.json(
      { error: "Rank tracking requires Neon DATABASE_URL." },
      { status: 503 }
    );
  }

  const limited = rateLimit(`rank-track:${clientKeyFromRequest(req)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { email?: string; url?: string; keyword?: string };
    if (!body.email?.includes("@") || !body.url || !body.keyword?.trim()) {
      return NextResponse.json({ error: "email, url, and keyword are required." }, { status: 400 });
    }
    await validateUrlSafe(body.url);
    const created = await subscribeRankTrack({
      email: body.email,
      url: normalizeUrl(body.url),
      keyword: body.keyword.trim(),
    });
    if (!created) {
      return NextResponse.json({ error: "Could not save rank track." }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      id: created.id,
      message: "Saved. Weekly cron will check this keyword when DataForSEO is configured.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Subscribe failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { analyzeBacklinkIntel } from "@/lib/backlink-intel";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limited = rateLimit(`tool:backlinks:${clientKeyFromRequest(req)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { yours?: string; competitors?: string[] };
    if (!body.yours) {
      return NextResponse.json({ error: "Your site URL is required." }, { status: 400 });
    }
    await validateUrlSafe(body.yours);
    const competitors = (body.competitors || []).filter(Boolean).slice(0, 3);
    for (const c of competitors) await validateUrlSafe(c);

    const result = await analyzeBacklinkIntel({
      yours: normalizeUrl(body.yours),
      competitors: competitors.map((c) => normalizeUrl(c)),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backlink intel failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { analyzePageGaps } from "@/lib/page-gap";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`tool:page-gap:${clientKeyFromRequest(req)}`, {
      limit: 12,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const body = (await req.json()) as { yours?: string; competitors?: string[] };
    if (!body.yours) {
      return NextResponse.json({ error: "Your site URL is required." }, { status: 400 });
    }
    const competitors = (body.competitors || []).filter(Boolean).slice(0, 5);
    if (competitors.length === 0) {
      return NextResponse.json({ error: "Add at least one competitor URL." }, { status: 400 });
    }

    await validateUrlSafe(body.yours);
    for (const c of competitors) await validateUrlSafe(c);

    const yours = normalizeUrl(body.yours);
    const comps = competitors.map((c) => normalizeUrl(c));
    const result = await analyzePageGaps(yours, comps);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Page gap analysis failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { analyzeContent } from "@/lib/content-analysis";
import { USER_AGENT_BOT } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`tool:content:${clientKeyFromRequest(req)}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const { url, keyword } = (await req.json()) as { url?: string; keyword?: string };
    if (!url || !keyword?.trim()) {
      return NextResponse.json({ error: "URL and keyword are required" }, { status: 400 });
    }

    await validateUrlSafe(url);
    const target = normalizeUrl(url);

    const res = await fetch(target, {
      headers: { "User-Agent": USER_AGENT_BOT, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const analysis = analyzeContent(html, target, keyword);

    return NextResponse.json(analysis);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Content analysis failed" },
      { status: 500 }
    );
  }
}

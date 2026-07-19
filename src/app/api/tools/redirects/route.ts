import { NextRequest, NextResponse } from "next/server";
import { USER_AGENT_BOT } from "@/lib/brand";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`tool:redirects:${clientKeyFromRequest(req)}`, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${limited.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    await validateUrlSafe(url);
    let current = new URL(normalizeUrl(url));

    const chain: Array<{ url: string; status: number; location: string | null }> = [];
    for (let i = 0; i < 10; i++) {
      await validateUrlSafe(current.toString());
      const res = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": USER_AGENT_BOT },
        signal: AbortSignal.timeout(12000),
      });
      const location = res.headers.get("location");
      chain.push({ url: current.toString(), status: res.status, location });
      if (res.status < 300 || res.status >= 400 || !location) break;
      current = new URL(location, current);
    }

    const final = chain[chain.length - 1];
    return NextResponse.json({
      hops: Math.max(0, chain.length - 1),
      finalUrl: final?.url ?? null,
      finalStatus: final?.status ?? null,
      https: (final?.url ?? "").startsWith("https://"),
      chain,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Redirect check failed" },
      { status: 500 }
    );
  }
}

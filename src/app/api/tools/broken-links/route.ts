import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

async function checkLink(href: string): Promise<{ url: string; status: number; ok: boolean }> {
  try {
    await validateUrlSafe(href);
    let res = await fetch(href, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "SEOScanBot/1.0 (+https://seoscan.app)" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(href, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "SEOScanBot/1.0 (+https://seoscan.app)" },
        signal: AbortSignal.timeout(8000),
      });
    }
    return { url: href, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch {
    return { url: href, status: 0, ok: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`tool:broken:${clientKeyFromRequest(req)}`, {
      limit: 12,
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
    const target = normalizeUrl(url);
    const parsed = new URL(target);

    const pageRes = await fetch(target, {
      headers: { "User-Agent": "SEOScanBot/1.0 (+https://seoscan.app)", Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const html = await pageRes.text();
    const $ = cheerio.load(html);

    const hrefs = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }
      try {
        hrefs.add(new URL(href, parsed).toString());
      } catch {
        /* skip */
      }
    });

    const list = Array.from(hrefs).slice(0, 40);
    const results: Array<{ url: string; status: number; ok: boolean }> = [];
    for (let i = 0; i < list.length; i += 8) {
      const batch = list.slice(i, i + 8);
      results.push(...(await Promise.all(batch.map(checkLink))));
    }

    const broken = results.filter((r) => !r.ok);
    return NextResponse.json({
      pageUrl: target,
      checked: results.length,
      brokenCount: broken.length,
      broken,
      okCount: results.filter((r) => r.ok).length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Broken link check failed" },
      { status: 500 }
    );
  }
}

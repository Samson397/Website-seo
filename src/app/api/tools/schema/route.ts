import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`tool:schema:${clientKeyFromRequest(req)}`, {
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
    const target = normalizeUrl(url);

    const res = await fetch(target, {
      headers: { "User-Agent": "SEOScanBot/1.0 (+https://seoscan.app)", Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const blocks: Array<{ type: string; types: string[]; validJson: boolean; preview: string }> = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html()?.trim() ?? "";
      let validJson = false;
      let types: string[] = [];
      try {
        const data = JSON.parse(raw) as unknown;
        validJson = true;
        const collect = (node: unknown) => {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) {
            node.forEach(collect);
            return;
          }
          const obj = node as Record<string, unknown>;
          if (typeof obj["@type"] === "string") types.push(obj["@type"]);
          if (Array.isArray(obj["@type"])) types.push(...(obj["@type"] as string[]));
          if (obj["@graph"]) collect(obj["@graph"]);
        };
        collect(data);
      } catch {
        validJson = false;
      }
      blocks.push({
        type: types[0] || "Unknown",
        types: Array.from(new Set(types)),
        validJson,
        preview: raw.slice(0, 280),
      });
    });

    return NextResponse.json({
      url: target,
      count: blocks.length,
      blocks,
      hasOrganization: blocks.some((b) => b.types.includes("Organization")),
      hasWebSite: blocks.some((b) => b.types.includes("WebSite")),
      hasBreadcrumb: blocks.some((b) => b.types.includes("BreadcrumbList")),
      hasFaq: blocks.some((b) => b.types.includes("FAQPage")),
      hasArticle: blocks.some((b) => b.types.some((t) => t.includes("Article"))),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Schema check failed" },
      { status: 500 }
    );
  }
}

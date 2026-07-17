import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { dataForSeoAuthHeader, getDataForSeoCredentials } from "@/lib/dataforseo";
import { USER_AGENT_BOT } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 45;

function countInText(text: string, keyword: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(`\\b${escaped}\\b`, "gi")) || []).length;
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`tool:rank:${clientKeyFromRequest(req)}`, {
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
    const kw = keyword.trim().toLowerCase();

    const res = await fetch(target, {
      headers: { "User-Agent": USER_AGENT_BOT, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $("title").text().trim();
    const meta = $('meta[name="description"]').attr("content")?.trim() || "";
    const h1 = $("h1").first().text().trim();
    const body = $("body").text().replace(/\s+/g, " ");
    const bodyCount = countInText(body, kw);

    const inTitle = title.toLowerCase().includes(kw);
    const inMeta = meta.toLowerCase().includes(kw);
    const inH1 = h1.toLowerCase().includes(kw);
    let inUrl = false;
    try {
      inUrl = new URL(target).pathname.toLowerCase().includes(kw.replace(/\s+/g, "-"));
    } catch {
      /* ignore */
    }

    let onPageScore = 0;
    if (inTitle) onPageScore += 30;
    if (inMeta) onPageScore += 15;
    if (inH1) onPageScore += 25;
    if (inUrl) onPageScore += 10;
    if (bodyCount > 0) onPageScore += Math.min(20, bodyCount * 5);

    let serpPosition: number | null = null;
    let serpUrl: string | null = null;
    let serpSource: "dataforseo" | null = null;

    const creds = getDataForSeoCredentials();
    if (creds) {
      try {
        const host = new URL(target).hostname.replace(/^www\./, "");
        const serpRes = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
          method: "POST",
          headers: {
            Authorization: dataForSeoAuthHeader(creds),
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keyword: kw,
              location_code: 2826,
              language_code: "en",
              depth: 100,
            },
          ]),
          signal: AbortSignal.timeout(25000),
        });
        if (serpRes.ok) {
          const data = await serpRes.json();
          const items = (data.tasks?.[0]?.result?.[0]?.items || []) as Array<{
            type?: string;
            rank_absolute?: number;
            url?: string;
            domain?: string;
          }>;
          for (const item of items) {
            if (item.type !== "organic" || !item.url) continue;
            const itemHost = (() => {
              try {
                return new URL(item.url).hostname.replace(/^www\./, "");
              } catch {
                return item.domain?.replace(/^www\./, "") || "";
              }
            })();
            if (itemHost === host || item.url.includes(host)) {
              serpPosition = item.rank_absolute ?? null;
              serpUrl = item.url;
              serpSource = "dataforseo";
              break;
            }
          }
        }
      } catch {
        /* optional */
      }
    }

    return NextResponse.json({
      url: target,
      keyword: kw,
      onPage: { inTitle, inMeta, inH1, inUrl, bodyCount, score: Math.min(100, onPageScore) },
      serp: {
        position: serpPosition,
        url: serpUrl,
        source: serpSource,
        available: Boolean(creds),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Rank check failed" },
      { status: 500 }
    );
  }
}

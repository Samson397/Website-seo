import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { extractKeywordIdeas } from "@/lib/content-analysis";
import { dataForSeoAuthHeader, getDataForSeoCredentials } from "@/lib/dataforseo";
import { USER_AGENT_BOT } from "@/lib/brand";
import {
  enrichKeywords,
  groupKeywordClusters,
  type EnrichedKeyword,
} from "@/lib/keyword-intelligence";

export const runtime = "nodejs";
export const maxDuration = 30;

async function googleSuggestions(seed: string): Promise<string[]> {
  try {
    const q = encodeURIComponent(seed);
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${q}`,
      { headers: { "User-Agent": USER_AGENT_BOT }, signal: AbortSignal.timeout(8000) }
    );
    const text = await res.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as unknown[];
    const suggestions = parsed[1];
    if (!Array.isArray(suggestions)) return [];
    return suggestions
      .map((s) => (Array.isArray(s) ? String(s[0]) : String(s)))
      .filter(Boolean)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`tool:keywords:${clientKeyFromRequest(req)}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const { url, seed } = (await req.json()) as { url?: string; seed?: string };
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    await validateUrlSafe(url);
    const target = normalizeUrl(url);

    const res = await fetch(target, {
      headers: { "User-Agent": USER_AGENT_BOT, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const onPage = extractKeywordIdeas(html, seed);
    const seedPhrase = seed?.trim() || onPage[0]?.phrase || new URL(target).hostname.split(".")[0];
    const suggestions = seedPhrase ? await googleSuggestions(seedPhrase) : [];

    let dataForSeo: EnrichedKeyword[] = [];
    const creds = getDataForSeoCredentials();
    if (creds && seedPhrase) {
      try {
        const dfsRes = await fetch(
          "https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live",
          {
            method: "POST",
            headers: {
              Authorization: dataForSeoAuthHeader(creds),
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                keywords: [seedPhrase],
                location_code: 2826,
                language_code: "en",
                limit: 20,
              },
            ]),
            signal: AbortSignal.timeout(20000),
          }
        );
        if (dfsRes.ok) {
          const data = await dfsRes.json();
          const items = (data.tasks?.[0]?.result || []) as Array<{
            keyword?: string;
            search_volume?: number;
            competition_index?: number;
            competition?: number;
            cpc?: number;
          }>;
          dataForSeo = enrichKeywords(
            items.slice(0, 20).map((i) => ({
              keyword: String(i.keyword || ""),
              volume: i.search_volume,
              difficulty: i.competition_index,
              competition: i.competition,
              cpc: i.cpc,
            }))
          );
        }
      } catch {
        /* optional */
      }
    }

    // Even without DataForSEO, enrich Google suggestions + on-page seeds
    const fallbackSeeds = [
      ...suggestions.slice(0, 10).map((phrase) => ({ keyword: phrase })),
      ...onPage.slice(0, 8).map((p) => ({ keyword: p.phrase })),
    ];
    if (dataForSeo.length === 0 && fallbackSeeds.length > 0) {
      dataForSeo = enrichKeywords(fallbackSeeds).slice(0, 15);
    }

    const clusters = groupKeywordClusters(dataForSeo);
    const top = dataForSeo[0];

    return NextResponse.json({
      url: target,
      seed: seedPhrase,
      onPage,
      suggestions: suggestions.map((phrase) => ({ phrase, source: "suggest" as const })),
      dataForSeo,
      clusters,
      example: top
        ? {
            keyword: top.keyword,
            intent: top.intent,
            difficulty: top.difficulty,
            recommendation: top.recommendation,
          }
        : null,
      hasDataForSeo: Boolean(creds) && dataForSeo.some((k) => k.volume != null),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Keyword research failed" },
      { status: 500 }
    );
  }
}

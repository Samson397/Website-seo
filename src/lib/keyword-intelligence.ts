export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

export interface EnrichedKeyword {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  competition?: number;
  intent: SearchIntent;
  recommendation: string;
  cluster: string;
}

const COMMERCIAL =
  /\b(best|top|vs|versus|review|reviews|compare|comparison|alternative|alternatives)\b/i;
const TRANSACTIONAL =
  /\b(buy|price|pricing|cheap|deal|coupon|discount|order|hire|book|near me|cost)\b/i;
const NAVIGATIONAL = /\b(login|sign in|official|website|www)\b/i;

export function classifyIntent(keyword: string): SearchIntent {
  const k = keyword.trim();
  if (NAVIGATIONAL.test(k)) return "navigational";
  if (TRANSACTIONAL.test(k)) return "transactional";
  if (COMMERCIAL.test(k)) return "commercial";
  return "informational";
}

export function difficultyLabel(difficulty?: number): string {
  if (difficulty == null) return "Unknown";
  if (difficulty < 35) return "Easy";
  if (difficulty < 65) return "Medium";
  return "Hard";
}

export function keywordRecommendation(keyword: string, intent: SearchIntent, difficulty?: number): string {
  const diff = difficultyLabel(difficulty);
  if (intent === "commercial") {
    return diff === "Hard"
      ? "Create a comparison / best-of page and build links before competing head-on"
      : "Create a service or comparison landing page targeting this phrase";
  }
  if (intent === "transactional") {
    return "Optimize a conversion page (pricing, booking, or product) for this keyword";
  }
  if (intent === "navigational") {
    return "Ensure brand / homepage title and schema match this navigational query";
  }
  return diff === "Easy"
    ? "Write a how-to or guide article and interlink it to money pages"
    : "Publish a thorough guide, then support with cluster articles";
}

export function clusterKey(keyword: string): string {
  const stop = new Set([
    "a",
    "an",
    "the",
    "for",
    "to",
    "of",
    "in",
    "on",
    "and",
    "or",
    "best",
    "top",
    "how",
    "what",
    "why",
    "near",
    "me",
  ]);
  const tokens = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !stop.has(t));
  if (tokens.length === 0) return keyword.toLowerCase();
  // Prefer the most distinctive 1–2 tokens
  return tokens.slice(0, 2).join(" ");
}

export function enrichKeywords(
  rows: Array<{
    keyword: string;
    volume?: number;
    difficulty?: number;
    cpc?: number;
    competition?: number;
  }>
): EnrichedKeyword[] {
  return rows
    .filter((r) => r.keyword)
    .map((r) => {
      const intent = classifyIntent(r.keyword);
      return {
        keyword: r.keyword,
        volume: r.volume,
        difficulty: r.difficulty,
        cpc: r.cpc,
        competition: r.competition,
        intent,
        recommendation: keywordRecommendation(r.keyword, intent, r.difficulty),
        cluster: clusterKey(r.keyword),
      };
    });
}

export function groupKeywordClusters(rows: EnrichedKeyword[]): Array<{
  cluster: string;
  keywords: EnrichedKeyword[];
}> {
  const map = new Map<string, EnrichedKeyword[]>();
  for (const row of rows) {
    const list = map.get(row.cluster) || [];
    list.push(row);
    map.set(row.cluster, list);
  }
  return Array.from(map.entries())
    .map(([cluster, keywords]) => ({
      cluster,
      keywords: keywords.sort(
        (a: EnrichedKeyword, b: EnrichedKeyword) => (b.volume || 0) - (a.volume || 0)
      ),
    }))
    .sort((a, b) => (b.keywords[0]?.volume || 0) - (a.keywords[0]?.volume || 0));
}

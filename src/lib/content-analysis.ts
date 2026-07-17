import * as cheerio from "cheerio";

export interface ContentAnalysis {
  url: string;
  keyword: string;
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  keywordCount: number;
  keywordDensity: number;
  inTitle: boolean;
  inMeta: boolean;
  inH1: boolean;
  inUrl: boolean;
  title: string;
  metaDescription: string;
  h1: string;
  score: number;
  recommendations: string[];
}

function countOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\b`, "gi");
  return (text.match(re) || []).length;
}

export function analyzeContent(html: string, url: string, keyword: string): ContentAnalysis {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";
  const h1 = $("h1").first().text().trim();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const words = bodyText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = Math.round(wordCount / sentenceCount);
  const kw = keyword.trim().toLowerCase();
  const keywordCount = countOccurrences(bodyText, kw);
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  const inTitle = title.toLowerCase().includes(kw);
  const inMeta = metaDescription.toLowerCase().includes(kw);
  const inH1 = h1.toLowerCase().includes(kw);
  let inUrl = false;
  try {
    inUrl = new URL(url).pathname.toLowerCase().includes(kw.replace(/\s+/g, "-"));
  } catch {
    inUrl = url.toLowerCase().includes(kw);
  }

  const recommendations: string[] = [];
  let score = 0;

  if (inTitle) score += 25;
  else recommendations.push("Add the target keyword to the page title (near the front).");

  if (inMeta) score += 15;
  else recommendations.push("Include the keyword naturally in the meta description.");

  if (inH1) score += 20;
  else recommendations.push("Use the keyword in a single, clear H1.");

  if (inUrl) score += 10;
  else recommendations.push("Consider a URL slug that reflects the keyword.");

  if (keywordCount >= 1 && keywordCount <= Math.max(3, Math.floor(wordCount / 150))) score += 15;
  else if (keywordCount === 0)
    recommendations.push("The keyword does not appear in body copy — add it where it fits naturally.");
  else recommendations.push("Keyword may be over-used — reduce repetition to avoid stuffing.");

  if (wordCount >= 300) score += 10;
  else recommendations.push("Page is thin — aim for at least 300 useful words for competitive topics.");

  if (avgWordsPerSentence <= 22) score += 5;
  else recommendations.push("Shorten long sentences for readability.");

  return {
    url,
    keyword: kw,
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    keywordCount,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    inTitle,
    inMeta,
    inH1,
    inUrl,
    title,
    metaDescription,
    h1,
    score: Math.min(100, score),
    recommendations,
  };
}

export interface KeywordIdea {
  phrase: string;
  source: "heading" | "title" | "meta" | "body" | "suggest";
  count?: number;
}

export function extractKeywordIdeas(html: string, seed?: string): KeywordIdea[] {
  const $ = cheerio.load(html);
  const ideas = new Map<string, KeywordIdea>();

  const add = (phrase: string, source: KeywordIdea["source"], count = 1) => {
    const p = phrase.trim().toLowerCase();
    if (p.length < 3 || p.length > 60) return;
    const existing = ideas.get(p);
    if (existing) {
      existing.count = (existing.count || 1) + count;
      return;
    }
    ideas.set(p, { phrase: p, source, count });
  };

  add($("title").text(), "title");
  add($('meta[name="description"]').attr("content") || "", "meta");
  $("h1, h2, h3").each((_, el) => add($(el).text(), "heading"));

  const body = $("body").text().replace(/\s+/g, " ").toLowerCase();
  const words = body.split(/\s+/).filter((w) => w.length > 3);
  for (let i = 0; i < words.length - 1; i++) {
    add(`${words[i]} ${words[i + 1]}`, "body");
    if (i < words.length - 2) add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`, "body");
  }

  if (seed) add(seed, "body");

  return Array.from(ideas.values())
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 40);
}

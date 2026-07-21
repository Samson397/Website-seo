import * as cheerio from "cheerio";
import type { AuditContext, SiteBrief } from "@/lib/types";

export type { SiteBrief };

type NicheRule = {
  niche: string;
  keywords: string[];
};

const NICHE_RULES: NicheRule[] = [
  {
    niche: "SEO / marketing software",
    keywords: [
      "seo",
      "search engine",
      "backlink",
      "keyword",
      "serp",
      "audit",
      "crawler",
      "rank tracking",
      "ahrefs",
      "semrush",
    ],
  },
  {
    niche: "Wedding / events",
    keywords: [
      "wedding",
      "bride",
      "groom",
      "venue",
      "reception",
      "ceremony",
      "bridal",
      "honeymoon",
      "rsvp",
    ],
  },
  {
    niche: "E-commerce / retail",
    keywords: [
      "shop",
      "cart",
      "checkout",
      "add to cart",
      "shipping",
      "product",
      "store",
      "buy now",
      "sku",
    ],
  },
  {
    niche: "SaaS / software",
    keywords: [
      "saas",
      "subscription",
      "dashboard",
      "api",
      "pricing",
      "sign up",
      "free trial",
      "platform",
      "workflow",
    ],
  },
  {
    niche: "Restaurant / food",
    keywords: [
      "restaurant",
      "menu",
      "reservation",
      "cuisine",
      "dining",
      "chef",
      "takeaway",
      "delivery",
    ],
  },
  {
    niche: "Healthcare / clinic",
    keywords: [
      "clinic",
      "doctor",
      "patient",
      "medical",
      "therapy",
      "dental",
      "appointment",
      "healthcare",
    ],
  },
  {
    niche: "Real estate",
    keywords: [
      "real estate",
      "property",
      "listing",
      "mortgage",
      "realtor",
      "for sale",
      "bedroom",
      "sq ft",
    ],
  },
  {
    niche: "Agency / freelancing",
    keywords: [
      "agency",
      "freelancer",
      "portfolio",
      "client",
      "case study",
      "hire",
      "consulting",
      "services",
    ],
  },
  {
    niche: "Blog / media",
    keywords: [
      "blog",
      "newsletter",
      "subscribe",
      "article",
      "podcast",
      "magazine",
      "news",
      "editorial",
    ],
  },
  {
    niche: "Education / courses",
    keywords: [
      "course",
      "lesson",
      "curriculum",
      "student",
      "learn",
      "tuition",
      "university",
      "training",
    ],
  },
  {
    niche: "Local business",
    keywords: [
      "hours",
      "location",
      "directions",
      "near me",
      "phone",
      "visit us",
      "storefront",
    ],
  },
];

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function scoreNiche(haystack: string, rule: NicheRule): { score: number; hits: string[] } {
  const hits: string[] = [];
  let score = 0;
  for (const kw of rule.keywords) {
    if (haystack.includes(kw)) {
      hits.push(kw);
      // Multi-word phrases count a bit more
      score += kw.includes(" ") ? 2 : 1;
    }
  }
  return { score, hits };
}

/**
 * Build a lightweight "what this site is" brief from homepage HTML.
 * Heuristic only — no API key required.
 */
export function buildSiteBrief(ctx: AuditContext): SiteBrief {
  const $ = cheerio.load(ctx.fetchResult.html);
  $("script, style, noscript").remove();

  const title = cleanText($("title").first().text());
  const description = cleanText(
    $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      ""
  );
  const h1 = cleanText($("h1").first().text());
  const ogSite = cleanText($('meta[property="og:site_name"]').attr("content") || "");
  const bodyText = cleanText($("body").text()).slice(0, 4000).toLowerCase();
  const haystack = `${title} ${description} ${h1} ${ogSite} ${bodyText}`.toLowerCase();

  let best = { niche: "General website", score: 0, hits: [] as string[] };
  for (const rule of NICHE_RULES) {
    const { score, hits } = scoreNiche(haystack, rule);
    if (score > best.score) best = { niche: rule.niche, score, hits };
  }

  const confidence =
    best.score >= 6 ? 0.9 : best.score >= 3 ? 0.7 : best.score >= 1 ? 0.45 : 0.2;

  let hostname = "";
  try {
    hostname = new URL(ctx.fetchResult.finalUrl).hostname.replace(/^www\./, "");
  } catch {
    hostname = ctx.url;
  }

  const topic = h1 || title || ogSite || hostname;
  const about =
    description ||
    cleanText($("main p, article p, p").first().text()).slice(0, 180) ||
    `${hostname} appears to be a public website.`;

  const summary =
    best.score >= 1
      ? `${topic} looks like a ${best.niche.toLowerCase()} site. ${about}`.slice(0, 320)
      : `${topic}: ${about}`.slice(0, 320);

  const signals = [
    title ? `title: ${title.slice(0, 60)}` : "",
    h1 ? `h1: ${h1.slice(0, 60)}` : "",
    ...best.hits.slice(0, 5).map((h) => `keyword: ${h}`),
  ].filter(Boolean);

  return {
    niche: best.niche,
    confidence,
    summary,
    signals,
  };
}

/** True when two briefs look like different niches (not both "General"). */
export function nichesDiffer(a?: SiteBrief | null, b?: SiteBrief | null): boolean {
  if (!a?.niche || !b?.niche) return false;
  if (a.niche === "General website" || b.niche === "General website") return false;
  if ((a.confidence ?? 0) < 0.45 || (b.confidence ?? 0) < 0.45) return false;
  return a.niche !== b.niche;
}

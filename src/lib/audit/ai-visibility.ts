import * as cheerio from "cheerio";
import { safeFetchText } from "@/lib/fetcher";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Google-CloudVertexBot",
  "PerplexityBot",
  "Bytespider",
  "CCBot",
  "Applebot-Extended",
] as const;

export interface AiVisibilitySignal {
  id: string;
  label: string;
  status: "pass" | "fail" | "attention";
  detail: string;
}

export interface AiVisibilityResult {
  score: number;
  signals: AiVisibilitySignal[];
  issues: AuditIssue[];
  botsAllowed: string[];
  botsBlocked: string[];
}

function botDisallowed(robots: string, bot: string): boolean {
  // Match User-agent block then look for Disallow: / before next User-agent
  const re = new RegExp(
    `User-agent:\\s*${bot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*([\\s\\S]*?)(?=User-agent:|$)`,
    "i"
  );
  const m = robots.match(re);
  if (!m) return false;
  return /^\s*Disallow:\s*\/\s*$/im.test(m[1]) || /Disallow:\s*\/\s*$/im.test(m[1].trim());
}

function parseJsonLd($: cheerio.CheerioAPI): unknown[] {
  const blocks: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      /* ignore */
    }
  });
  return blocks;
}

function jsonIncludesType(blocks: unknown[], type: string): boolean {
  const want = type.toLowerCase();
  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== "object") return false;
    if (Array.isArray(node)) return node.some(walk);
    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string" && t.toLowerCase() === want) return true;
    if (Array.isArray(t) && t.some((x) => String(x).toLowerCase() === want)) return true;
    return Object.values(obj).some(walk);
  };
  return blocks.some(walk);
}

function hasSameAs(blocks: unknown[]): boolean {
  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== "object") return false;
    if (Array.isArray(node)) return node.some(walk);
    const obj = node as Record<string, unknown>;
    if (obj.sameAs) return true;
    return Object.values(obj).some(walk);
  };
  return blocks.some(walk);
}

/**
 * GEO / AI-search readiness: can assistants discover, cite, and recommend this site?
 */
export async function runAiVisibilityAudit(ctx: AuditContext): Promise<AiVisibilityResult> {
  const issues: AuditIssue[] = [];
  const signals: AiVisibilitySignal[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;
  const jsonLd = parseJsonLd($);

  const robots = (await safeFetchText("/robots.txt", baseUrl)) || "";
  const botsBlocked = AI_BOTS.filter((bot) => robots && botDisallowed(robots, bot));
  const botsAllowed = AI_BOTS.filter((bot) => !botsBlocked.includes(bot));

  if (botsBlocked.length === 0) {
    signals.push({
      id: "ai-bots",
      label: "AI crawlers allowed",
      status: "pass",
      detail: robots
        ? "No blanket Disallow for major AI bots in robots.txt."
        : "No robots.txt — crawlers are not explicitly blocked.",
    });
  } else {
    signals.push({
      id: "ai-bots",
      label: "AI crawlers blocked",
      status: "fail",
      detail: `Blocked: ${botsBlocked.join(", ")}`,
    });
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "AI assistants may not index this site",
        description:
          "Major AI crawlers are disallowed in robots.txt, so ChatGPT, Perplexity, Claude, and similar tools are less likely to cite or recommend your pages.",
        currentValue: botsBlocked.join(", "),
        recommendation:
          "Allow GPTBot, ClaudeBot, PerplexityBot, and Google-Extended if you want AI search visibility (GEO).",
      })
    );
  }

  const llmsTxt = await safeFetchText("/llms.txt", baseUrl);
  if (llmsTxt && llmsTxt.trim().length > 20) {
    signals.push({
      id: "llms-txt",
      label: "llms.txt present",
      status: "pass",
      detail: "AI systems can read guidance from /llms.txt.",
    });
  } else {
    signals.push({
      id: "llms-txt",
      label: "llms.txt missing",
      status: "attention",
      detail: "Add /llms.txt so assistants know how to use your content.",
    });
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No llms.txt for AI assistants",
        description:
          "llms.txt helps ChatGPT, Perplexity, and other AI tools understand what to cite from your site.",
        recommendation: "Publish a short /llms.txt summarizing your product and key URLs.",
        fixSnippet: "# Example\n> Brand Name — what you do\n\n## Docs\n- https://yoursite.com/about",
      })
    );
  }

  const hasOrg = jsonIncludesType(jsonLd, "Organization") || jsonIncludesType(jsonLd, "LocalBusiness");
  const hasWebsite = jsonIncludesType(jsonLd, "WebSite");
  const sameAs = hasSameAs(jsonLd);

  if (hasOrg) {
    signals.push({
      id: "org-schema",
      label: "Organization schema",
      status: "pass",
      detail: "Entity markup helps AI systems identify your brand.",
    });
  } else {
    signals.push({
      id: "org-schema",
      label: "Organization schema missing",
      status: "fail",
      detail: "Without Organization JSON-LD, assistants struggle to ground your brand.",
    });
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Missing Organization schema for AI brand recognition",
        description:
          "AI answer engines prefer clear entity markup when deciding which brands to mention.",
        recommendation: "Add Organization (or LocalBusiness) JSON-LD with name, url, and logo.",
      })
    );
  }

  if (hasWebsite) {
    signals.push({
      id: "website-schema",
      label: "WebSite schema",
      status: "pass",
      detail: "WebSite markup present.",
    });
  } else {
    signals.push({
      id: "website-schema",
      label: "WebSite schema missing",
      status: "attention",
      detail: "Add WebSite schema with your canonical site name.",
    });
  }

  if (sameAs) {
    signals.push({
      id: "same-as",
      label: "sameAs entity links",
      status: "pass",
      detail: "Social/profile sameAs links strengthen brand identity for AI.",
    });
  } else {
    signals.push({
      id: "same-as",
      label: "No sameAs links",
      status: "attention",
      detail: "Link LinkedIn, X, GitHub, or Wikipedia via schema sameAs.",
    });
  }

  const hasFaq = jsonIncludesType(jsonLd, "FAQPage");
  if (hasFaq) {
    signals.push({
      id: "faq",
      label: "FAQ schema",
      status: "pass",
      detail: "FAQ content is easy for AI to quote in answers.",
    });
  } else {
    signals.push({
      id: "faq",
      label: "No FAQ schema",
      status: "attention",
      detail: "Add FAQPage markup on key pages you want assistants to cite.",
    });
  }

  const title = $("title").first().text().trim();
  const h1 = $("h1").first().text().trim();
  const desc = $('meta[name="description"]').attr("content")?.trim() || "";
  const brandClear = title.length >= 10 && h1.length >= 3 && desc.length >= 50;
  if (brandClear) {
    signals.push({
      id: "clear-copy",
      label: "Clear brand copy",
      status: "pass",
      detail: "Title, H1, and description give AI enough context to recommend you.",
    });
  } else {
    signals.push({
      id: "clear-copy",
      label: "Thin brand signals",
      status: "attention",
      detail: "Strengthen title, H1, and meta description so AI can summarize your offer.",
    });
  }

  const ogSite = $('meta[property="og:site_name"]').attr("content")?.trim();
  if (ogSite) {
    signals.push({
      id: "og-site",
      label: "og:site_name set",
      status: "pass",
      detail: `Site name: ${ogSite}`,
    });
  } else {
    signals.push({
      id: "og-site",
      label: "og:site_name missing",
      status: "attention",
      detail: "Set og:site_name so AI and social tools use a consistent brand label.",
    });
  }

  // Score from signals
  let score = 100;
  for (const s of signals) {
    if (s.status === "fail") score -= 18;
    else if (s.status === "attention") score -= 8;
  }
  score = Math.max(0, Math.min(100, score));

  if (score < 60) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Low AI visibility — assistants may not promote this site",
        description: `AI readiness score is ${Math.round(score / 10)}/10. Blocked crawlers, missing entity markup, or weak brand copy reduce mentions in ChatGPT, Perplexity, and similar tools.`,
        recommendation:
          "Allow AI bots, add llms.txt + Organization schema, and publish clear FAQ/about content.",
      })
    );
  }

  return { score, signals, issues, botsAllowed: [...botsAllowed], botsBlocked: [...botsBlocked] };
}

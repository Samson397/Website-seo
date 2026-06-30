import * as cheerio from "cheerio";
import { AuditContext } from "@/lib/types";

export interface SocialProfile {
  platform: string;
  url: string;
}

const SOCIAL_PATTERNS: { platform: string; pattern: RegExp }[] = [
  { platform: "Facebook", pattern: /facebook\.com\/[\w.-]+/i },
  { platform: "Twitter/X", pattern: /(twitter\.com|x\.com)\/[\w]+/i },
  { platform: "Instagram", pattern: /instagram\.com\/[\w.]+/i },
  { platform: "LinkedIn", pattern: /linkedin\.com\/(company|in)\/[\w.-]+/i },
  { platform: "YouTube", pattern: /youtube\.com\/(channel|c|@|user)\/[\w.-]+/i },
  { platform: "TikTok", pattern: /tiktok\.com\/@[\w.]+/i },
  { platform: "Pinterest", pattern: /pinterest\.com\/[\w]+/i },
  { platform: "GitHub", pattern: /github\.com\/[\w.-]+/i },
];

export function extractSocialProfiles(ctx: AuditContext): SocialProfile[] {
  const $ = cheerio.load(ctx.fetchResult.html);
  const found = new Map<string, string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const { platform, pattern } of SOCIAL_PATTERNS) {
      if (pattern.test(href) && !found.has(platform)) {
        try {
          const url = new URL(href, ctx.fetchResult.finalUrl).href;
          if (!url.includes("/share") && !url.includes("/intent")) {
            found.set(platform, url);
          }
        } catch {
          // skip
        }
      }
    }
  });

  return Array.from(found.entries()).map(([platform, url]) => ({ platform, url }));
}

export function extractExternalLinks(ctx: AuditContext): {
  total: number;
  uniqueDomains: number;
  topDomains: { domain: string; count: number }[];
  links: { url: string; anchor: string; domain: string }[];
} {
  const $ = cheerio.load(ctx.fetchResult.html);
  const origin = new URL(ctx.fetchResult.finalUrl).origin;
  const domainCounts = new Map<string, number>();
  const links: { url: string; anchor: string; domain: string }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }
    try {
      const resolved = new URL(href, ctx.fetchResult.finalUrl);
      if (resolved.origin === origin) return;
      if (!resolved.protocol.startsWith("http")) return;

      const domain = resolved.hostname.replace(/^www\./, "");
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      if (links.length < 50) {
        links.push({
          url: resolved.href,
          anchor: $(el).text().trim().substring(0, 80) || "(no text)",
          domain,
        });
      }
    } catch {
      // skip
    }
  });

  const topDomains = Array.from(domainCounts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    total: Array.from(domainCounts.values()).reduce((s, c) => s + c, 0),
    uniqueDomains: domainCounts.size,
    topDomains,
    links,
  };
}

import * as cheerio from "cheerio";
import { safeFetchText, safeHead, validateUrlSafe } from "@/lib/fetcher";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const BROKEN_IMAGE_CONCURRENCY = 8;
const BROKEN_IMAGE_MAX = 40;
const GENERIC_LINK_TEXT = /^(click here|here|read more|learn more|more|link|this|go)$/i;

async function countRedirectHops(urlString: string): Promise<number> {
  let url = urlString;
  let hops = 0;

  for (let i = 0; i < 10; i++) {
    const parsed = await validateUrlSafe(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(parsed.href, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "WebsiteSEO-Auditor/1.0" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;
        url = new URL(location, parsed.href).href;
        hops++;
        continue;
      }
      break;
    } catch {
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  return hops;
}

export async function runDeepChecksAudit(ctx: AuditContext): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;

  const robotsMeta =
    $('meta[name="robots"]').attr("content") ||
    $('meta[name="googlebot"]').attr("content") ||
    "";
  if (/noindex/i.test(robotsMeta)) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "critical",
        title: "Page blocked from indexing (noindex)",
        description:
          "This page tells search engines not to index it. It will not appear in Google search results.",
        currentValue: robotsMeta,
        recommendation: "Remove noindex from meta robots unless this page should stay private.",
        fixSnippet: '<meta name="robots" content="index, follow">',
      })
    );
  }

  if (/nofollow/i.test(robotsMeta) && !/noindex/i.test(robotsMeta)) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Links set to nofollow",
        description: "The nofollow directive tells search engines not to follow links on this page.",
        currentValue: robotsMeta,
        recommendation: "Remove nofollow unless you intentionally want to block link equity flow.",
      })
    );
  }

  const hreflangTags = $('link[rel="alternate"][hreflang]');
  if (hreflangTags.length > 0) {
    const langs = new Set<string>();
    let missingHref = 0;
    hreflangTags.each((_, el) => {
      const lang = $(el).attr("hreflang")?.toLowerCase();
      const href = $(el).attr("href");
      if (lang) langs.add(lang);
      if (!href) missingHref++;
    });
    if (missingHref > 0) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Hreflang tags missing href",
          description: "International hreflang tags must include a valid href for each language.",
          recommendation: "Add href attributes pointing to the correct localized URL.",
        })
      );
    }
    if (!langs.has("x-default")) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: "Hreflang missing x-default",
          description: "x-default tells search engines which page to show when no language matches.",
          recommendation: 'Add <link rel="alternate" hreflang="x-default" href="...">',
        })
      );
    }
  }

  const title = $("title").first().text().trim().toLowerCase();
  const h1 = $("h1").first().text().trim().toLowerCase();
  if (title && h1 && title !== h1 && !title.includes(h1) && !h1.includes(title)) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Title and H1 don't align",
        description: "Your page title and main heading should describe the same topic for clarity and SEO.",
        currentValue: `Title: "${$("title").first().text().trim()}" · H1: "${$("h1").first().text().trim()}"`,
        recommendation: "Align the title tag and H1 around the same primary topic.",
      })
    );
  }

  $('script[type="application/ld+json"]').each((i, el) => {
    const raw = $(el).html()?.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      // Bare arrays are valid JSON-LD but Safari's parser errors on them — prefer @graph.
      const hasContext = (() => {
        if (!parsed || typeof parsed !== "object") return false;
        if (Array.isArray(parsed)) {
          return parsed.some(
            (node) =>
              node &&
              typeof node === "object" &&
              Boolean((node as Record<string, unknown>)["@context"])
          );
        }
        return Boolean((parsed as Record<string, unknown>)["@context"]);
      })();
      if (!hasContext) {
        issues.push(
          createIssue({
            category: "seo",
            severity: "warning",
            title: "Invalid structured data (missing @context)",
            description: "JSON-LD blocks need an @context property to be valid.",
            currentValue: `Block ${i + 1}`,
            recommendation:
              'Use a single object with "@context": "https://schema.org" and "@graph" for multiple types (avoids Safari errors from bare arrays).',
          })
        );
      }
    } catch {
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Invalid structured data (JSON parse error)",
          description: "Malformed JSON-LD cannot be read by Google and may cause rich result errors.",
          currentValue: `Block ${i + 1}`,
          recommendation: "Fix JSON syntax in your structured data script tag.",
        })
      );
    }
  });

  const emptyLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const aria = $(el).attr("aria-label")?.trim();
    if (!text && !aria) {
      const href = $(el).attr("href") || "";
      emptyLinks.push(href.length > 50 ? `${href.slice(0, 50)}…` : href || "(no href)");
    }
  });
  if (emptyLinks.length > 0) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "warning",
        title: "Empty links found",
        description: "Links with no visible text or aria-label are unusable for screen reader users.",
        currentValue: `${emptyLinks.length} link(s): ${emptyLinks.slice(0, 3).join(", ")}`,
        recommendation: "Add descriptive link text or an aria-label to every link.",
      })
    );
  }

  const genericLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (GENERIC_LINK_TEXT.test(text)) {
      genericLinks.push(`"${text}"`);
    }
  });
  if (genericLinks.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Generic link text detected",
        description: 'Links like "click here" don\'t tell search engines or users what the destination is.',
        currentValue: `${genericLinks.length} link(s): ${Array.from(new Set(genericLinks)).slice(0, 4).join(", ")}`,
        recommendation: "Use descriptive anchor text that explains where the link goes.",
      })
    );
  }

  const blockingCss = $('head link[rel="stylesheet"]').filter((_, el) => {
    const media = $(el).attr("media");
    return !media || media === "all" || media === "screen";
  }).length;
  if (blockingCss > 3) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "info",
        title: "Many render-blocking stylesheets",
        description: "Multiple CSS files in the head can delay first paint.",
        currentValue: `${blockingCss} stylesheet(s) in <head>`,
        recommendation: "Combine CSS, inline critical styles, or defer non-critical stylesheets.",
      })
    );
  }

  const usesExternalFonts =
    $.html().includes("fonts.googleapis.com") || $.html().includes("fonts.gstatic.com");
  const hasPreconnect = $('link[rel="preconnect"]').length > 0;
  if (usesExternalFonts && !hasPreconnect) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "info",
        title: "External fonts without preconnect",
        description: "Preconnect hints speed up Google Fonts and other third-party font hosts.",
        recommendation:
          '<link rel="preconnect" href="https://fonts.googleapis.com"> and fonts.gstatic.com',
      })
    );
  }

  const robotsContent = await safeFetchText("/robots.txt", baseUrl);
  if (robotsContent) {
    const blocksAll = /User-agent:\s*\*\s*\nDisallow:\s*\/\s*$/im.test(robotsContent);
    if (blocksAll) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "critical",
          title: "robots.txt blocks all crawlers",
          description: "Your robots.txt disallows all pages for all user agents.",
          recommendation: "Change Disallow rules so public pages can be crawled.",
        })
      );
    }

    const aiBots = ["GPTBot", "ClaudeBot", "Google-Extended", "Bytespider"];
    const blockedAi = aiBots.filter((bot) =>
      new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`, "i").test(robotsContent)
    );
    if (blockedAi.length > 0) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: "AI crawlers blocked in robots.txt",
          description: "Some AI crawlers are explicitly disallowed — your content may not appear in AI tools.",
          currentValue: blockedAi.join(", "),
          recommendation: "Review whether you want to allow AI crawlers for visibility in AI search.",
        })
      );
    }
  }

  try {
    const hops = await countRedirectHops(ctx.fetchResult.url);
    if (hops > 1) {
      issues.push(
        createIssue({
          category: "seo",
          severity: hops > 2 ? "warning" : "info",
          title: "Redirect chain detected",
          description: "Multiple redirects slow page loads and waste crawl budget.",
          currentValue: `${hops} redirect hop(s) before final page`,
          recommendation: "Link directly to the final URL and use a single 301 redirect.",
        })
      );
    }
  } catch {
    // skip redirect check on invalid URLs
  }

  const imageUrls: string[] = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src")?.trim();
    if (!src || src.startsWith("data:")) return;
    try {
      imageUrls.push(new URL(src, baseUrl).href);
    } catch {
      // skip
    }
  });

  const uniqueImages = Array.from(new Set(imageUrls)).slice(0, BROKEN_IMAGE_MAX);
  const brokenImages: string[] = [];

  for (let i = 0; i < uniqueImages.length; i += BROKEN_IMAGE_CONCURRENCY) {
    const batch = uniqueImages.slice(i, i + BROKEN_IMAGE_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (imgUrl) => {
        const result = await safeHead(imgUrl);
        if (result.status === 0 || result.status >= 400) return imgUrl;
        return null;
      })
    );
    for (const broken of results) {
      if (broken) brokenImages.push(broken);
    }
  }

  for (const broken of brokenImages) {
    issues.push(
      createIssue({
        category: "links",
        severity: "warning",
        title: "Broken image",
        description: "Images that fail to load hurt user experience and may affect image search.",
        currentValue: broken,
        recommendation: "Fix the image URL or replace the missing image.",
      })
    );
  }

  if (imageUrls.length > BROKEN_IMAGE_MAX) {
    issues.push(
      createIssue({
        category: "links",
        severity: "info",
        title: "Additional images not checked",
        description: `Found ${imageUrls.length} images and checked ${BROKEN_IMAGE_MAX} for availability.`,
        currentValue: `${BROKEN_IMAGE_MAX} of ${imageUrls.length} images checked`,
        recommendation: "Fix any broken images found above, then re-scan.",
      })
    );
  }

  return issues;
}

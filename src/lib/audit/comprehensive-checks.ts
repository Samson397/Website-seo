import * as cheerio from "cheerio";
import { safeFetchText, safeHead } from "@/lib/fetcher";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const HEAD_CONCURRENCY = 6;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

async function headBatch(urls: string[]): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  for (let i = 0; i < urls.length; i += HEAD_CONCURRENCY) {
    const batch = urls.slice(i, i + HEAD_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const r = await safeHead(url);
        return { url, status: r.status };
      })
    );
    for (const { url, status } of batchResults) {
      results.set(url, status);
    }
  }
  return results;
}

function parseSitemapLocs(xml: string, cap: number): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null && urls.length < cap) {
    urls.push(match[1].trim());
  }
  return urls;
}

export async function runComprehensiveChecksAudit(ctx: AuditContext): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;
  const origin = new URL(baseUrl).origin;
  const headers = ctx.fetchResult.headers;

  if (!$('meta[charset]').length && !$('meta[http-equiv="Content-Type"]').length) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Missing character encoding",
        description: "Without charset, browsers may misrender special characters.",
        recommendation: 'Add <meta charset="utf-8"> as the first element in <head>.',
        fixSnippet: '<meta charset="utf-8">',
      })
    );
  }

  if ($('meta[http-equiv="refresh"]').length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Meta refresh redirect detected",
        description: "Meta refresh redirects are unreliable and not recommended for SEO.",
        recommendation: "Use a server-side 301 redirect instead.",
      })
    );
  }

  if ($("title").length > 1) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Multiple title tags",
        description: "Only one <title> tag should exist. Multiple titles confuse search engines.",
        currentValue: `${$("title").length} title tags`,
        recommendation: "Remove duplicate <title> tags, keeping one unique title.",
      })
    );
  }

  if ($('meta[name="description"]').length > 1) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Multiple meta descriptions",
        description: "Duplicate meta description tags can cause unpredictable search snippets.",
        currentValue: `${$('meta[name="description"]').length} description tags`,
        recommendation: "Use a single meta description per page.",
      })
    );
  }

  if ($('link[rel="canonical"]').length > 1) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Multiple canonical URLs",
        description: "Pages should have exactly one canonical URL.",
        recommendation: "Remove duplicate canonical link tags.",
      })
    );
  }

  const canonical = $('link[rel="canonical"]').attr("href");
  if (canonical) {
    try {
      const canonicalUrl = new URL(canonical, baseUrl);
      if (canonicalUrl.origin !== origin) {
        issues.push(
          createIssue({
            category: "seo",
            severity: "info",
            title: "Canonical points to different domain",
            description: "Cross-domain canonicals tell Google another site owns this content.",
            currentValue: canonicalUrl.href,
            recommendation: "Ensure the canonical URL points to the preferred version on your domain.",
          })
        );
      }
    } catch {
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Invalid canonical URL",
          description: "The canonical link tag contains a malformed URL.",
          currentValue: canonical,
          recommendation: "Fix the href in your canonical link tag.",
        })
      );
    }
  }

  if ($('meta[name="keywords"]').attr("content")) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Meta keywords tag present",
        description: "Google ignores meta keywords. They may hint at keyword stuffing to other engines.",
        recommendation: "Remove the meta keywords tag — it provides no SEO benefit.",
      })
    );
  }

  const xRobots = headers["x-robots-tag"] || "";
  if (/noindex/i.test(xRobots)) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "critical",
        title: "X-Robots-Tag blocks indexing",
        description: "The server sends an X-Robots-Tag header with noindex.",
        currentValue: xRobots,
        recommendation: "Remove noindex from X-Robots-Tag unless intentional.",
      })
    );
  }

  const viewport = $('meta[name="viewport"]').attr("content") || "";
  if (/user-scalable\s*=\s*no/i.test(viewport) || /maximum-scale\s*=\s*1/i.test(viewport)) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "warning",
        title: "Viewport restricts zoom",
        description: "Preventing pinch-zoom hurts users with low vision on mobile.",
        currentValue: viewport,
        recommendation: "Remove user-scalable=no and maximum-scale=1 from the viewport meta tag.",
      })
    );
  }

  const blankExternalUnsafe: string[] = [];
  $("a[target='_blank'], a[target='_blank' i]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const rel = ($(el).attr("rel") || "").toLowerCase();
    if (!href.startsWith("http")) return;
    try {
      const linkOrigin = new URL(href, baseUrl).origin;
      if (linkOrigin !== origin && !rel.includes("noopener") && !rel.includes("noreferrer")) {
        blankExternalUnsafe.push(href.slice(0, 60));
      }
    } catch {
      // skip
    }
  });
  if (blankExternalUnsafe.length > 0) {
    issues.push(
      createIssue({
        category: "security",
        severity: "warning",
        title: "External links missing rel=noopener",
        description: "target=_blank without noopener allows tab-nabbing attacks.",
        currentValue: `${blankExternalUnsafe.length} link(s)`,
        recommendation: 'Add rel="noopener noreferrer" to external target=_blank links.',
        fixSnippet: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">',
      })
    );
  }

  const internalNofollow = $("a[rel*='nofollow' i]").filter((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return false;
    try {
      return new URL(href, baseUrl).origin === origin;
    } catch {
      return false;
    }
  }).length;
  if (internalNofollow > 2) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Nofollow on internal links",
        description: "Using nofollow on internal links stops PageRank flow within your site.",
        currentValue: `${internalNofollow} internal nofollow links`,
        recommendation: "Remove nofollow from internal navigation links unless intentional.",
      })
    );
  }

  const idCounts = new Map<string, number>();
  $("[id]").each((_, el) => {
    const id = $(el).attr("id") || "";
    if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
  });
  const duplicateIds = Array.from(idCounts.entries()).filter(([, c]) => c > 1);
  if (duplicateIds.length > 0) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "warning",
        title: "Duplicate ID attributes",
        description: "IDs must be unique. Duplicates break labels, anchors, and assistive tech.",
        currentValue: duplicateIds
          .slice(0, 4)
          .map(([id]) => `#${id}`)
          .join(", "),
        recommendation: "Ensure every id attribute value appears only once on the page.",
      })
    );
  }

  const domNodes = $("*").length;
  if (domNodes > 1500) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "warning",
        title: "Very large DOM",
        description: "Heavy DOM trees slow rendering and increase memory use on mobile.",
        currentValue: `${domNodes} DOM elements`,
        recommendation: "Reduce nested elements and lazy-load non-critical UI.",
      })
    );
  } else if (domNodes > 800) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "info",
        title: "Large DOM size",
        description: "Pages with many DOM nodes can feel sluggish on low-end devices.",
        currentValue: `${domNodes} DOM elements`,
        recommendation: "Simplify markup where possible.",
      })
    );
  }

  const iframeCount = $("iframe").length;
  if (iframeCount > 5) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "info",
        title: "Many embedded iframes",
        description: "Each iframe loads a separate page and adds overhead.",
        currentValue: `${iframeCount} iframes`,
        recommendation: "Reduce third-party embeds or lazy-load them.",
      })
    );
  }

  const iframesNoTitle = $("iframe").filter((_, el) => !$(el).attr("title")).length;
  if (iframesNoTitle > 0) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "warning",
        title: "Iframe missing title",
        description: "Iframes need a title attribute for screen reader users.",
        currentValue: `${iframesNoTitle} iframe(s)`,
        recommendation: 'Add title="Description of embedded content" to each iframe.',
      })
    );
  }

  const tablesNoTh = $("table").filter((_, el) => $(el).find("th").length === 0).length;
  if (tablesNoTh > 0) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "warning",
        title: "Data tables missing header cells",
        description: "Tables used for data need <th> elements so screen readers can navigate them.",
        currentValue: `${tablesNoTh} table(s)`,
        recommendation: "Add <th> header cells to data tables.",
      })
    );
  }

  const emptyButtons: string[] = [];
  $("button").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const aria = $(el).attr("aria-label")?.trim();
    if (!text && !aria) emptyButtons.push("<button>");
  });
  if (emptyButtons.length > 0) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "warning",
        title: "Buttons without accessible names",
        description: "Icon-only buttons need aria-label or visible text.",
        currentValue: `${emptyButtons.length} button(s)`,
        recommendation: 'Add aria-label="Action name" or visible button text.',
      })
    );
  }

  if (!$("a[href='#main'], a[href='#content'], a[href='#main-content']").length &&
      !/skip to (main|content)/i.test($.text())) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "info",
        title: "No skip navigation link",
        description: "Skip links let keyboard users jump past repetitive navigation.",
        recommendation: 'Add a "Skip to main content" link at the top of the page.',
        fixSnippet: '<a href="#main" class="skip-link">Skip to main content</a>',
      })
    );
  }

  if (!$("main, [role='main']").length) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "info",
        title: "No main landmark",
        description: "A <main> element helps screen reader users jump to primary content.",
        recommendation: "Wrap primary page content in a <main> element.",
        fixSnippet: "<main>...</main>",
      })
    );
  }

  if ($("nav, [role='navigation']").length === 0 && $("a[href]").length > 10) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "info",
        title: "No navigation landmark",
        description: "Pages with many links should use a <nav> landmark for structure.",
        recommendation: "Wrap site navigation in a <nav> element.",
      })
    );
  }

  const deprecatedTags = ["font", "center", "marquee", "blink", "strike", "u"].filter(
    (tag) => $(tag).length > 0
  );
  if (deprecatedTags.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Deprecated HTML tags found",
        description: "Legacy tags like <font> and <center> should be replaced with CSS.",
        currentValue: deprecatedTags.map((t) => `<${t}>`).join(", "),
        recommendation: "Use semantic HTML and CSS for styling.",
      })
    );
  }

  if ($.html().includes("document.write(")) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "warning",
        title: "document.write() detected",
        description: "document.write blocks parsing and hurts performance, especially on mobile.",
        recommendation: "Replace document.write with DOM APIs or deferred script loading.",
      })
    );
  }

  const externalScriptsNoIntegrity = $("script[src]")
    .filter((_, el) => {
      const src = $(el).attr("src") || "";
      if (!src.startsWith("http")) return false;
      try {
        return new URL(src, baseUrl).origin !== origin && !$(el).attr("integrity");
      } catch {
        return false;
      }
    }).length;
  if (externalScriptsNoIntegrity > 0) {
    issues.push(
      createIssue({
        category: "security",
        severity: "info",
        title: "External scripts without Subresource Integrity",
        description: "SRI ensures CDN scripts haven't been tampered with.",
        currentValue: `${externalScriptsNoIntegrity} script(s)`,
        recommendation: "Add integrity and crossorigin attributes to third-party scripts.",
      })
    );
  }

  const baseHref = $("base").attr("href");
  if (baseHref) {
    try {
      const baseOrigin = new URL(baseHref, baseUrl).origin;
      if (baseOrigin !== origin) {
        issues.push(
          createIssue({
            category: "security",
            severity: "warning",
            title: "Base tag points to external domain",
            description: "A cross-origin <base> tag can redirect all relative links elsewhere.",
            currentValue: baseHref,
            recommendation: "Remove the base tag or point it to your own domain.",
          })
        );
      }
    } catch {
      issues.push(
        createIssue({
          category: "security",
          severity: "warning",
          title: "Invalid base tag href",
          currentValue: baseHref,
          description: "The base tag contains a malformed URL.",
          recommendation: "Fix or remove the <base> tag.",
        })
      );
    }
  }

  const plainText = $.text();
  const exposedEmails = plainText.match(EMAIL_REGEX)?.filter(
    (e) => !e.endsWith(".png") && !e.endsWith(".jpg")
  );
  const uniqueEmails = exposedEmails ? Array.from(new Set(exposedEmails)) : [];
  if (uniqueEmails.length > 2) {
    issues.push(
      createIssue({
        category: "security",
        severity: "info",
        title: "Email addresses exposed in page text",
        description: "Visible emails attract spam bots. Consider obfuscation or contact forms.",
        currentValue: `${uniqueEmails.length} address(es) found`,
        recommendation: "Use a contact form or encode emails to reduce scraper harvest.",
      })
    );
  }

  const hasFeedLink =
    $('link[type="application/rss+xml"]').length > 0 ||
    $('link[type="application/atom+xml"]').length > 0;
  const looksLikeBlog = /blog|news|article|post/i.test(baseUrl) || $("article").length > 0;
  if (looksLikeBlog && !hasFeedLink) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No RSS/Atom feed link",
        description: "Blog and news sites often provide feeds for subscribers and syndication.",
        recommendation: 'Add <link rel="alternate" type="application/rss+xml" href="/feed">',
      })
    );
  }

  const urlsToVerify: { url: string; label: string }[] = [];

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    try {
      urlsToVerify.push({ url: new URL(ogImage, baseUrl).href, label: "og:image" });
    } catch {
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Invalid Open Graph image URL",
          currentValue: ogImage,
          description: "The og:image URL is malformed.",
          recommendation: "Fix the og:image meta tag with a valid absolute URL.",
        })
      );
    }
  }

  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    "/favicon.ico";
  try {
    urlsToVerify.push({ url: new URL(favicon, baseUrl).href, label: "favicon" });
  } catch {
    // skip
  }

  const securityTxt = await safeFetchText("/.well-known/security.txt", baseUrl);
  if (!securityTxt) {
    issues.push(
      createIssue({
        category: "security",
        severity: "info",
        title: "No security.txt file",
        description: "security.txt tells researchers how to report vulnerabilities responsibly.",
        recommendation: "Publish /.well-known/security.txt with a Contact field.",
      })
    );
  }

  const adsTxt = await safeFetchText("/ads.txt", baseUrl);
  const hasAdScripts = /googlesyndication|adsbygoogle|doubleclick/i.test($.html());
  if (hasAdScripts && !adsTxt) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No ads.txt file",
        description: "Sites running ads should publish ads.txt to authorize ad sellers.",
        recommendation: "Create /ads.txt per your ad network's instructions.",
      })
    );
  }

  const sitemapXml = await safeFetchText("/sitemap.xml", baseUrl);
  if (sitemapXml) {
    const sampleUrls = parseSitemapLocs(sitemapXml, 5);
    const brokenSitemapUrls: string[] = [];
    if (sampleUrls.length > 0) {
      const statuses = await headBatch(sampleUrls);
      for (const [url, status] of Array.from(statuses.entries())) {
        if (status === 0 || status >= 400) brokenSitemapUrls.push(url);
      }
    }
    if (brokenSitemapUrls.length > 0) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Broken URLs in sitemap",
          description: "Sampled sitemap URLs returned errors — Google may struggle to index them.",
          currentValue: brokenSitemapUrls.slice(0, 3).join(", "),
          recommendation: "Fix or remove dead URLs from sitemap.xml.",
        })
      );
    }
  }

  if (urlsToVerify.length > 0) {
    const statuses = await headBatch(urlsToVerify.map((u) => u.url));
    for (const { url, label } of urlsToVerify) {
      const status = statuses.get(url) || 0;
      if (status === 0 || status >= 400) {
        issues.push(
          createIssue({
            category: label === "favicon" ? "seo" : "seo",
            severity: label === "og:image" ? "warning" : "info",
            title: label === "og:image" ? "Open Graph image unreachable" : "Favicon unreachable",
            description:
              label === "og:image"
                ? "Social shares may show no preview image if og:image fails to load."
                : "Browsers may show a generic tab icon if the favicon fails to load.",
            currentValue: `${url} (HTTP ${status || "error"})`,
            recommendation: "Fix the URL or upload the missing asset.",
          })
        );
      }
    }
  }

  const lastModified = headers["last-modified"];
  if (!lastModified && $("article, .blog, .post").length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No Last-Modified header",
        description: "Last-Modified helps crawlers know when content changed.",
        recommendation: "Send a Last-Modified response header for content pages.",
      })
    );
  }

  const permissionsPolicy = headers["permissions-policy"] || headers["feature-policy"];
  if (!permissionsPolicy) {
    issues.push(
      createIssue({
        category: "security",
        severity: "info",
        title: "No Permissions-Policy header",
        description: "Permissions-Policy restricts access to browser features like camera and geolocation.",
        recommendation: "Add a Permissions-Policy header to disable unused browser APIs.",
        fixSnippet: "Permissions-Policy: camera=(), microphone=(), geolocation=()",
      })
    );
  }

  return issues;
}

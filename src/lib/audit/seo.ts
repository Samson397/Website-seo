import * as cheerio from "cheerio";
import { safeFetchText } from "@/lib/fetcher";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

export async function runSeoAudit(ctx: AuditContext): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;

  const title = $("title").first().text().trim();
  if (!title) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "critical",
        title: "Missing page title",
        description:
          "The <title> tag is one of the most important SEO elements. Search engines use it as the primary headline in search results.",
        recommendation: "Add a unique, descriptive <title> tag between 30–60 characters.",
        fixSnippet: "<title>Your Page Title Here (30-60 characters)</title>",
      })
    );
  } else if (title.length < 30) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Title tag too short",
        description: "Short titles may not fully describe your page and can reduce click-through rates in search results.",
        currentValue: `"${title}" (${title.length} chars)`,
        recommendation: "Expand your title to 30–60 characters with relevant keywords.",
        fixSnippet: `<title>${title} — Add More Descriptive Keywords Here</title>`,
      })
    );
  } else if (title.length > 60) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Title tag too long",
        description: "Titles over 60 characters may be truncated in Google search results.",
        currentValue: `"${title}" (${title.length} chars)`,
        recommendation: "Shorten your title to 60 characters or fewer.",
      })
    );
  }

  const description = $('meta[name="description"]').attr("content")?.trim();
  if (!description) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "critical",
        title: "Missing meta description",
        description:
          "Meta descriptions appear in search results and influence click-through rates. Google may auto-generate one if missing.",
        recommendation: "Add a meta description between 120–160 characters summarizing the page.",
        fixSnippet:
          '<meta name="description" content="Your page description here (120-160 characters)">',
      })
    );
  } else if (description.length < 120) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Meta description too short",
        description: "Short descriptions may not provide enough context to entice users to click.",
        currentValue: `"${description}" (${description.length} chars)`,
        recommendation: "Expand your meta description to 120–160 characters.",
      })
    );
  } else if (description.length > 160) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Meta description too long",
        description: "Descriptions over 160 characters may be truncated in search results.",
        currentValue: `"${description.substring(0, 80)}..." (${description.length} chars)`,
        recommendation: "Shorten your meta description to 160 characters or fewer.",
      })
    );
  }

  const h1Count = $("h1").length;
  if (h1Count === 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "critical",
        title: "Missing H1 heading",
        description:
          "Every page should have exactly one H1 heading. It tells search engines the main topic of the page.",
        recommendation: "Add a single H1 heading that describes the page's main topic.",
        fixSnippet: "<h1>Your Main Page Heading</h1>",
      })
    );
  } else if (h1Count > 1) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Multiple H1 headings found",
        description: "Having more than one H1 can confuse search engines about the page's primary topic.",
        currentValue: `${h1Count} H1 tags found`,
        recommendation: "Use a single H1 for the main heading and H2–H6 for subsections.",
      })
    );
  }

  const canonical = $('link[rel="canonical"]').attr("href");
  if (!canonical) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Missing canonical URL",
        description:
          "Canonical tags prevent duplicate content issues by telling search engines the preferred URL for a page.",
        recommendation: "Add a canonical link pointing to this page's preferred URL.",
        fixSnippet: `<link rel="canonical" href="${baseUrl}">`,
      })
    );
  }

  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");

  if (!ogTitle) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Missing Open Graph title",
        description:
          "Open Graph tags control how your page appears when shared on social media (Facebook, LinkedIn, etc.).",
        recommendation: "Add an og:title meta tag.",
        fixSnippet: `<meta property="og:title" content="${title || "Your Page Title"}">`,
      })
    );
  }

  if (!ogDescription) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Missing Open Graph description",
        description: "og:description provides a summary when your page is shared on social media.",
        recommendation: "Add an og:description meta tag.",
        fixSnippet: `<meta property="og:description" content="${description || "Your page description"}">`,
      })
    );
  }

  if (!ogImage) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Missing Open Graph image",
        description:
          "Pages shared without an og:image appear as plain text links, reducing engagement.",
        recommendation: "Add an og:image meta tag with a 1200×630px image URL.",
        fixSnippet: `<meta property="og:image" content="https://yoursite.com/images/og-image.jpg">`,
      })
    );
  }

  const jsonLd = $('script[type="application/ld+json"]');
  if (jsonLd.length === 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No structured data (JSON-LD) found",
        description:
          "Structured data helps search engines understand your content and can enable rich results (stars, FAQs, etc.).",
        recommendation: "Add JSON-LD structured data appropriate for your content type.",
        fixSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${title || "Page Name"}",
  "description": "${description || "Page description"}",
  "url": "${baseUrl}"
}
</script>`,
      })
    );
  }

  const parsedBase = new URL(baseUrl);
  const robotsUrl = `${parsedBase.origin}/robots.txt`;
  const robotsContent = await safeFetchText("/robots.txt", baseUrl);
  if (!robotsContent) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "robots.txt not found",
        description:
          "robots.txt tells search engine crawlers which pages they can or cannot access.",
        currentValue: `Not reachable at ${robotsUrl}`,
        recommendation: "Create a robots.txt file at your site root.",
        fixSnippet: `User-agent: *
Allow: /

Sitemap: ${parsedBase.origin}/sitemap.xml`,
      })
    );
  }

  const sitemapUrl = `${parsedBase.origin}/sitemap.xml`;
  const sitemapContent = await safeFetchText("/sitemap.xml", baseUrl);
  if (!sitemapContent) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "sitemap.xml not found",
        description:
          "An XML sitemap helps search engines discover and index all pages on your site.",
        currentValue: `Not reachable at ${sitemapUrl}`,
        recommendation: "Create and submit a sitemap.xml to Google Search Console.",
        fixSnippet: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`,
      })
    );
  }

  if (ctx.fetchResult.status >= 400) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "critical",
        title: "Page returns error status",
        description: "Pages returning 4xx or 5xx status codes cannot be indexed by search engines.",
        currentValue: `HTTP ${ctx.fetchResult.status}`,
        recommendation: "Fix the server error or redirect to a valid page.",
      })
    );
  }

  return issues;
}

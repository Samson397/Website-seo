import * as cheerio from "cheerio";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

export function runMobileSocialAudit(ctx: AuditContext): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;

  const viewport = $('meta[name="viewport"]').attr("content");
  if (!viewport) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "critical",
        title: "Missing viewport meta tag",
        description:
          "Without a viewport tag, mobile browsers render the page at desktop width, making it unreadable on phones. Google uses mobile-first indexing.",
        recommendation: "Add a viewport meta tag to the <head>.",
        fixSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      })
    );
  } else if (!viewport.includes("width=device-width")) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Viewport meta tag may be incorrect",
        description: "The viewport should include width=device-width for proper mobile rendering.",
        currentValue: viewport,
        recommendation: 'Use content="width=device-width, initial-scale=1".',
        fixSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      })
    );
  }

  const twitterCard = $('meta[name="twitter:card"]').attr("content");
  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (!twitterCard) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Missing Twitter/X card tag",
        description:
          "Twitter/X cards control how your page appears when shared on X (formerly Twitter).",
        recommendation: 'Add twitter:card meta tag (use "summary_large_image" for best results).',
        fixSnippet: `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Your Page Title">
<meta name="twitter:description" content="Your page description">`,
      })
    );
  }
  if (twitterCard && !twitterImage) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Missing Twitter/X image",
        description: "Tweets with images get significantly more engagement.",
        recommendation: "Add a twitter:image meta tag with a 1200×675px image URL.",
        fixSnippet: `<meta name="twitter:image" content="https://yoursite.com/images/twitter-card.jpg">`,
      })
    );
  }

  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href");
  const appleIcon = $('link[rel="apple-touch-icon"]').attr("href");

  if (!favicon) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Missing favicon",
        description:
          "Favicons appear in browser tabs and bookmarks. Missing favicons look unprofessional.",
        recommendation: "Add a favicon.ico or PNG favicon in your site root.",
        fixSnippet: `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
      })
    );
  }

  if (!appleIcon) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Missing Apple touch icon",
        description:
          "Apple touch icons are used when users add your site to their iPhone home screen.",
        recommendation: "Add a 180×180px apple-touch-icon.",
        fixSnippet: `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
      })
    );
  }

  try {
    const parsed = new URL(baseUrl);
    const path = parsed.pathname + parsed.search;
    if (path.length > 100) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "URL is too long",
          description: "Long URLs are harder to share and may be truncated in search results.",
          currentValue: `${path.length} characters`,
          recommendation: "Use short, descriptive URLs with keywords separated by hyphens.",
        })
      );
    }
    if (/[A-Z_%]/.test(path)) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: "URL contains uppercase or special characters",
          description: "Clean, lowercase URLs with hyphens rank better and are easier to read.",
          currentValue: path,
          recommendation: "Use lowercase URLs with hyphens instead of underscores or capitals.",
        })
      );
    }
  } catch {
    // ignore URL parse errors
  }

  return issues;
}

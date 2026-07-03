import * as cheerio from "cheerio";
import { DnsInfo, DomainInfo, SslInfo } from "@/lib/audit/domain-intel";
import { TechnologyInfo } from "@/lib/audit/technology";
import { SocialProfile } from "@/lib/audit/social";
import { AuditContext } from "@/lib/types";
import { supportsEmailDnsChecks } from "@/lib/platform-domain";

export type ChecklistStatus = "has" | "missing" | "warning";

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  explanation: string;
  fixHint?: string;
}

export interface SiteChecklist {
  hasCount: number;
  missingCount: number;
  warningCount: number;
  items: ChecklistItem[];
  summary: string;
}

function item(
  id: string,
  label: string,
  status: ChecklistStatus,
  explanation: string,
  fixHint?: string
): ChecklistItem {
  return { id, label, status, explanation, fixHint };
}

function countWords(html: string): number {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $.text().replace(/\s+/g, " ").trim();
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

export interface ChecklistExtras {
  brokenLinkCount: number;
  brokenImageCount: number;
  isIndexable: boolean;
  hasValidSchema: boolean;
  hasManifest: boolean;
  hasLlmsTxt: boolean;
  hasMixedContent: boolean;
  wwwDuplicate: boolean;
  hasRedirectChain: boolean;
}

export function buildSiteChecklist(
  ctx: AuditContext,
  technologies: TechnologyInfo[],
  socialProfiles: SocialProfile[],
  dnsInfo: DnsInfo,
  sslInfo: SslInfo,
  domainInfo: DomainInfo,
  hasRobotsTxt: boolean,
  hasSitemap: boolean,
  hasBacklinks: boolean,
  backlinkCount: number | undefined,
  extras: ChecklistExtras
): SiteChecklist {
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;
  const hostname = new URL(baseUrl).hostname;
  const checkEmailDns = supportsEmailDnsChecks(hostname);
  const items: ChecklistItem[] = [];

  const title = $("title").first().text().trim();
  items.push(
    title.length >= 10
      ? item("title", "Page title", "has", `Your page has a title: "${title.substring(0, 50)}${title.length > 50 ? "…" : ""}"`)
      : item("title", "Page title", "missing", "Your page has no title tag. Google uses this as the headline in search results.", "Add a <title> tag describing your page.")
  );

  const desc = $('meta[name="description"]').attr("content")?.trim();
  items.push(
    desc && desc.length >= 50
      ? item("description", "Meta description", "has", "You have a description that can appear in Google search results.")
      : item("description", "Meta description", "missing", "No description for Google to show under your link in search results.", "Add a meta description (120–160 characters).")
  );

  items.push(
    $("h1").length === 1
      ? item("h1", "Main heading (H1)", "has", "Your page has one clear main heading.")
      : $("h1").length === 0
        ? item("h1", "Main heading (H1)", "missing", "No H1 found. Every page needs one main heading.", "Add one <h1> tag with your page topic.")
        : item("h1", "Main heading (H1)", "warning", `Found ${$("h1").length} H1 tags. Use only one per page.`, "Keep a single H1 and use H2 for subsections.")
  );

  items.push(
    baseUrl.startsWith("https://")
      ? item("https", "Secure connection (HTTPS)", "has", "Your site uses HTTPS — visitors see the padlock icon.")
      : item("https", "Secure connection (HTTPS)", "missing", "Your site is not on HTTPS. Browsers may show 'Not Secure'.", "Install an SSL certificate and redirect HTTP to HTTPS.")
  );

  items.push(
    $('meta[name="viewport"]').attr("content")?.includes("width=device-width")
      ? item("viewport", "Mobile-friendly viewport", "has", "Your page is set up to display correctly on phones.")
      : item("viewport", "Mobile-friendly viewport", "missing", "Missing viewport tag — your site may look broken on mobile.", 'Add <meta name="viewport" content="width=device-width, initial-scale=1">')
  );

  items.push(
    $('link[rel="icon"]').length > 0 || $('link[rel="shortcut icon"]').length > 0
      ? item("favicon", "Favicon (tab icon)", "has", "Your site has a favicon for browser tabs.")
      : item("favicon", "Favicon (tab icon)", "missing", "No favicon — browser tabs show a generic icon.", "Add favicon.ico or a favicon link in your <head>.")
  );

  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  items.push(
    ogTitle && ogImage
      ? item("og", "Social sharing preview", "has", "Links shared on Facebook/LinkedIn will show a title and image.")
      : item("og", "Social sharing preview", "missing", "Missing Open Graph tags — shared links may look plain.", "Add og:title, og:description, and og:image meta tags.")
  );

  items.push(
    $('link[rel="canonical"]').attr("href")
      ? item("canonical", "Canonical URL", "has", "You told search engines which URL is the official version of this page.")
      : item("canonical", "Canonical URL", "missing", "No canonical URL — duplicate pages may confuse Google.", 'Add <link rel="canonical" href="...">')
  );

  items.push(
    $('script[type="application/ld+json"]').length > 0
      ? item("schema", "Structured data (Schema)", "has", "Structured data helps Google show rich results (stars, FAQs, etc.).")
      : item("schema", "Structured data (Schema)", "missing", "No structured data found — you may miss rich search results.", "Add JSON-LD schema for your content type.")
  );

  const imgs = $("img");
  const imgsNoAlt = imgs.filter((_, el) => $(el).attr("alt") === undefined).length;
  items.push(
    imgs.length === 0
      ? item("alt", "Image descriptions (alt text)", "warning", "No images on this page.", "Add relevant images with alt text for SEO and accessibility.")
      : imgsNoAlt === 0
        ? item("alt", "Image descriptions (alt text)", "has", "All images have alt text.")
        : item("alt", "Image descriptions (alt text)", "missing", `${imgsNoAlt} of ${imgs.length} images missing alt text.`, 'Add alt="description" to every image.')
  );

  items.push(
    $("html").attr("lang")
      ? item("lang", "Page language", "has", `Language set to "${$("html").attr("lang")}" — helps screen readers and Google.`)
      : item("lang", "Page language", "missing", "No language set on the page.", 'Add lang="en" (or your language) to the <html> tag.')
  );

  const hasPrivacy = /privacy/i.test($.html());
  items.push(
    hasPrivacy
      ? item("privacy", "Privacy policy link", "has", "A privacy policy link was found on the page.")
      : item("privacy", "Privacy policy link", "missing", "No privacy policy link found — needed if you collect emails or use cookies.", "Add a Privacy Policy link in your footer.")
  );

  const hasContact = /contact|about|get-in-touch/i.test($.html());
  items.push(
    hasContact
      ? item("contact", "Contact or About page", "has", "Visitors can find a way to reach you or learn about you.")
      : item("contact", "Contact or About page", "missing", "No contact or about link found — hurts trust.", "Add Contact or About links in your navigation or footer.")
  );

  items.push(
    hasRobotsTxt
      ? item("robots", "robots.txt file", "has", "Search engine crawlers can read your robots.txt rules.")
      : item("robots", "robots.txt file", "missing", "No robots.txt at your site root.", "Create a robots.txt file at yoursite.com/robots.txt")
  );

  items.push(
    hasSitemap
      ? item("sitemap", "XML sitemap", "has", "Google can discover all your pages via sitemap.xml.")
      : item("sitemap", "XML sitemap", "missing", "No sitemap.xml found — Google may miss pages.", "Create sitemap.xml and submit it in Google Search Console.")
  );

  items.push(
    socialProfiles.length > 0
      ? item("social", "Social media links", "has", `Found: ${socialProfiles.map((p) => p.platform).join(", ")}`)
      : item("social", "Social media links", "missing", "No social profile links found on the page.", "Link your Facebook, Instagram, LinkedIn, etc. in the footer.")
  );

  const hasAnalytics = technologies.some((t) => t.category === "Analytics");
  items.push(
    hasAnalytics
      ? item("analytics", "Visitor tracking (Analytics)", "has", `Detected: ${technologies.filter((t) => t.category === "Analytics").map((t) => t.name).join(", ")}`)
      : item("analytics", "Visitor tracking (Analytics)", "warning", "No analytics detected — you can't measure traffic.", "Install Google Analytics 4 or similar.")
  );

  if (checkEmailDns) {
    items.push(
      dnsInfo.hasSpf
        ? item("spf", "Email SPF record", "has", "SPF helps your emails reach inboxes instead of spam.")
        : item("spf", "Email SPF record", "missing", "No SPF record — emails from your domain may go to spam.", "Add an SPF TXT record to your DNS.")
    );

    items.push(
      dnsInfo.hasDmarc
        ? item("dmarc", "Email DMARC record", "has", "DMARC protects your domain from email spoofing.")
        : item("dmarc", "Email DMARC record", "missing", "No DMARC record found.", "Add a DMARC record at _dmarc.yourdomain.com")
    );
  }

  items.push(
    sslInfo.daysUntilExpiry !== undefined && sslInfo.daysUntilExpiry > 30
      ? item("ssl", "SSL certificate valid", "has", `Certificate valid for ${sslInfo.daysUntilExpiry} more days.`)
      : sslInfo.daysUntilExpiry !== undefined && sslInfo.daysUntilExpiry > 0
        ? item("ssl", "SSL certificate valid", "warning", `SSL expires in ${sslInfo.daysUntilExpiry} days — renew soon!`)
        : item("ssl", "SSL certificate valid", "missing", "SSL certificate issue or expiring very soon.", "Renew your SSL certificate immediately.")
  );

  items.push(
    domainInfo.daysUntilExpiry !== undefined && domainInfo.daysUntilExpiry > 30
      ? item("domain", "Domain registration", "has", `Domain registered, expires in ${domainInfo.daysUntilExpiry} days.`)
      : domainInfo.daysUntilExpiry !== undefined && domainInfo.daysUntilExpiry > 0
        ? item("domain", "Domain registration", "warning", `Domain expires in ${domainInfo.daysUntilExpiry} days!`)
        : item("domain", "Domain registration", "warning", "Could not verify domain expiry — check with your registrar.")
  );

  const encoding = ctx.fetchResult.headers["content-encoding"] || "";
  items.push(
    encoding.includes("gzip") || encoding.includes("br")
      ? item("compression", "Page compression", "has", "Your server compresses pages for faster loading.")
      : item("compression", "Page compression", "missing", "No gzip/Brotli compression — pages load slower.", "Enable compression on your server or CDN.")
  );

  const responseMs = ctx.fetchResult.responseTimeMs;
  items.push(
    responseMs !== undefined && responseMs < 1000
      ? item("speed", "Server response speed", "has", `Server responded in ${responseMs}ms — good speed.`)
      : responseMs !== undefined && responseMs < 3000
        ? item("speed", "Server response speed", "warning", `Server took ${responseMs}ms to respond — could be faster.`)
        : item("speed", "Server response speed", "missing", "Server is very slow or unreachable.", "Use faster hosting or a CDN.")
  );

  if (hasBacklinks) {
    items.push(
      backlinkCount && backlinkCount > 0
        ? item("backlinks", "Other sites linking to you", "has", `${backlinkCount} backlinks found from other websites.`)
        : item("backlinks", "Other sites linking to you", "missing", "No other websites link to yours yet.", "Create great content and reach out to earn links.")
    );
  }

  const hasTerms = /terms|terms-of-service|terms-and-conditions|\/tos/i.test($.html());
  items.push(
    hasTerms
      ? item("terms", "Terms of service", "has", "A terms of service link was found on the page.")
      : item("terms", "Terms of service", "warning", "No terms of service link — recommended if you have forms or accounts.", "Add a Terms of Service link in your footer.")
  );

  items.push(
    $('meta[name="twitter:card"]').attr("content")
      ? item("twitter", "Twitter/X share preview", "has", "Your page has Twitter/X card tags for sharing.")
      : item("twitter", "Twitter/X share preview", "missing", "Missing Twitter/X card tags — links shared on X may look plain.", 'Add <meta name="twitter:card" content="summary_large_image">')
  );

  items.push(
    $('link[rel="apple-touch-icon"]').length > 0
      ? item("apple-icon", "Apple touch icon", "has", "Your site has an icon for iPhone home screens.")
      : item("apple-icon", "Apple touch icon", "missing", "No Apple touch icon — iPhone bookmarks use a generic icon.", 'Add <link rel="apple-touch-icon" href="/apple-touch-icon.png">')
  );

  const hasCookieBanner =
    /seoscan-cookie-consent|cookie-consent-banner|cookiebot|onetrust|cookie-consent|cookiebanner|gdpr|iubenda|termly|osano|analytics cookies|uses cookies/i.test(
      $.html()
    );
  items.push(
    hasCookieBanner
      ? item("cookies", "Cookie consent notice", "has", "A cookie consent or privacy banner was detected.")
      : item("cookies", "Cookie consent notice", "warning", "No cookie banner detected — may be required in EU/UK if you use analytics or cookies.", "Add a cookie consent banner if you track visitors or use cookies.")
  );

  items.push(
    extras.hasManifest
      ? item("manifest", "Web app manifest", "has", "manifest.json found — supports mobile install and PWA features.")
      : item("manifest", "Web app manifest", "missing", "No manifest.json — missing PWA and mobile install support.", "Add a manifest.json at your site root.")
  );

  items.push(
    extras.hasLlmsTxt
      ? item("llms", "AI crawler instructions (llms.txt)", "has", "llms.txt tells AI systems how to use your content.")
      : item("llms", "AI crawler instructions (llms.txt)", "warning", "No llms.txt — AI crawlers may not know how to treat your site.", "Add an llms.txt file at your site root.")
  );

  if (checkEmailDns) {
    items.push(
      dnsInfo.hasDkim
        ? item("dkim", "Email DKIM record", "has", "DKIM helps verify your emails are genuinely from you.")
        : item("dkim", "Email DKIM record", "missing", "No DKIM record found — email authentication is incomplete.", "Add DKIM records from your email provider to DNS.")
    );
  }

  const headers = ctx.fetchResult.headers;
  const hasHsts = Boolean(headers["strict-transport-security"]);
  const hasFrameOptions = Boolean(headers["x-frame-options"]);
  items.push(
    hasHsts && hasFrameOptions
      ? item("sec-headers", "Security headers", "has", "Key security headers (HSTS, X-Frame-Options) are present.")
      : hasHsts || hasFrameOptions
        ? item("sec-headers", "Security headers", "warning", "Some security headers are missing — site is partially protected.", "Add HSTS and X-Frame-Options headers on your server.")
        : item("sec-headers", "Security headers", "missing", "Missing security headers — easier target for clickjacking and downgrade attacks.", "Add Strict-Transport-Security and X-Frame-Options headers.")
  );

  items.push(
    extras.hasMixedContent
      ? item("mixed", "Mixed content (HTTP on HTTPS)", "missing", "Page loads insecure HTTP resources on an HTTPS page — browsers may block them.", "Change all resource URLs to https://")
      : item("mixed", "Mixed content (HTTP on HTTPS)", "has", "No mixed HTTP content detected on this HTTPS page.")
  );

  items.push(
    extras.wwwDuplicate
      ? item("www", "www vs non-www setup", "warning", "Both www and non-www versions work — can cause duplicate content in Google.", "Pick one version and 301-redirect the other.")
      : item("www", "www vs non-www setup", "has", "No duplicate www/non-www conflict detected.")
  );

  const wordCount = countWords(ctx.fetchResult.html);
  items.push(
    wordCount >= 300
      ? item("content", "Enough page content", "has", `Page has ${wordCount} words — good depth for search engines.`)
      : wordCount >= 100
        ? item("content", "Enough page content", "warning", `Only ${wordCount} words — thin content may rank poorly.`, "Add more useful, original text (aim for 300+ words).")
        : item("content", "Enough page content", "missing", `Only ${wordCount} words — Google may see this as low quality.`, "Add substantial content that covers your topic.")
  );

  items.push(
    extras.brokenLinkCount === 0
      ? item("links", "Broken links", "has", "No broken links found on checked links.")
      : item("links", "Broken links", "missing", `${extras.brokenLinkCount} broken link${extras.brokenLinkCount === 1 ? "" : "s"} found — hurts SEO and user experience.`, "Fix or remove links that return 404 or errors.")
  );

  items.push(
    extras.isIndexable
      ? item("indexable", "Google can index this page", "has", "No noindex directive — search engines may include this page in results.")
      : item("indexable", "Google can index this page", "missing", "This page is blocked from indexing.", "Remove noindex from meta robots unless intentional.")
  );

  items.push(
    extras.hasValidSchema
      ? item("schema-valid", "Structured data is valid", "has", "JSON-LD structured data parsed without errors.")
      : item("schema-valid", "Structured data is valid", "warning", "Structured data has errors or is missing @context.", "Fix JSON-LD syntax and include @context.")
  );

  items.push(
    extras.brokenImageCount === 0
      ? item("images-ok", "Images load correctly", "has", "Checked images returned successfully.")
      : item("images-ok", "Images load correctly", "missing", `${extras.brokenImageCount} broken image${extras.brokenImageCount === 1 ? "" : "s"} found.`, "Fix or replace images that return errors.")
  );

  items.push(
    !extras.hasRedirectChain
      ? item("redirects", "Clean URL (no redirect chain)", "has", "Page loads without a long redirect chain.")
      : item("redirects", "Clean URL (no redirect chain)", "warning", "Multiple redirects detected before the page loads.", "Use a single direct URL or one 301 redirect.")
  );

  const unlabeledInputs = $("input, select, textarea")
    .filter((_, el) => {
      const id = $(el).attr("id");
      const aria = $(el).attr("aria-label") || $(el).attr("aria-labelledby");
      if (aria) return false;
      if (id && $(`label[for="${id}"]`).length > 0) return false;
      const wrapped = $(el).closest("label").length > 0;
      return !wrapped;
    }).length;
  items.push(
    unlabeledInputs === 0
      ? item("forms", "Accessible form fields", "has", "Form inputs have labels for screen readers.")
      : item("forms", "Accessible form fields", "missing", `${unlabeledInputs} form field${unlabeledInputs === 1 ? "" : "s"} missing labels.`, 'Add <label for="id"> matching each input id.')
  );

  const hasCount = items.filter((i) => i.status === "has").length;
  const missingCount = items.filter((i) => i.status === "missing").length;
  const warningCount = items.filter((i) => i.status === "warning").length;

  let summary: string;
  if (missingCount === 0 && warningCount === 0) {
    summary = "Great job — your site has everything we checked for!";
  } else if (missingCount <= 3) {
    summary = `Your site looks good overall. Fix ${missingCount} missing item${missingCount === 1 ? "" : "s"} below to improve further.`;
  } else if (missingCount <= 8) {
    summary = `Your site is missing ${missingCount} important things. Fixing these will help Google and visitors trust you more.`;
  } else {
    summary = `Your site is missing ${missingCount} key items. Start with the ones marked in red — they matter most.`;
  }

  return { hasCount, missingCount, warningCount, items, summary };
}

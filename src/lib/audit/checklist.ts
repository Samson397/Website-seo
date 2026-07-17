import * as cheerio from "cheerio";
import { DnsInfo, DomainInfo, SslInfo } from "@/lib/audit/domain-intel";
import { TechnologyInfo } from "@/lib/audit/technology";
import { SocialProfile } from "@/lib/audit/social";
import { AuditContext, CheckCategory, SiteChecklist } from "@/lib/types";
import { supportsEmailDnsChecks } from "@/lib/platform-domain";

export type ChecklistStatus = "pass" | "fail" | "attention";

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  category: CheckCategory;
  explanation: string;
  fixHint?: string;
}

function item(
  id: string,
  label: string,
  status: ChecklistStatus,
  category: CheckCategory,
  explanation: string,
  fixHint?: string
): ChecklistItem {
  return { id, label, status, category, explanation, fixHint };
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
  hasFaqSchema: boolean;
  hasOrganizationSchema: boolean;
  hasSecurityTxt: boolean;
  hasMainLandmark: boolean;
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
  const headers = ctx.fetchResult.headers;

  // ——— SEO ———
  const title = $("title").first().text().trim();
  items.push(
    title.length >= 10
      ? item("title", "Page title", "pass", "seo", `Title present (${title.length} chars).`)
      : item("title", "Page title", "fail", "seo", "No usable title tag for search results.", "Add a descriptive <title> (about 50–60 characters).")
  );
  items.push(
    title.length > 0 && title.length <= 60
      ? item("title-length", "Title length", "pass", "seo", "Title length looks good for Google snippets.")
      : title.length > 60
        ? item("title-length", "Title length", "attention", "seo", `Title is ${title.length} characters — may be truncated.`, "Aim for 50–60 characters.")
        : item("title-length", "Title length", "fail", "seo", "Title is too short or missing.", "Write a clear 50–60 character title.")
  );

  const desc = $('meta[name="description"]').attr("content")?.trim();
  items.push(
    desc && desc.length >= 50
      ? item("description", "Meta description", "pass", "seo", `Description present (${desc.length} chars).`)
      : item("description", "Meta description", "fail", "seo", "Missing or weak meta description.", "Add a meta description of 120–160 characters.")
  );
  items.push(
    desc && desc.length >= 120 && desc.length <= 160
      ? item("description-length", "Description length", "pass", "seo", "Description length fits typical SERP display.")
      : desc
        ? item("description-length", "Description length", "attention", "seo", `Description is ${desc.length} characters.`, "Target 120–160 characters.")
        : item("description-length", "Description length", "fail", "seo", "No description to measure.", "Add a meta description.")
  );

  items.push(
    $("h1").length === 1
      ? item("h1", "Single H1 heading", "pass", "seo", "One clear main heading.")
      : $("h1").length === 0
        ? item("h1", "Single H1 heading", "fail", "seo", "No H1 found.", "Add one <h1> with the page topic.")
        : item("h1", "Single H1 heading", "attention", "seo", `Found ${$("h1").length} H1 tags.`, "Keep a single H1; use H2 for sections.")
  );

  const h2Count = $("h2").length;
  items.push(
    h2Count >= 1
      ? item("h2", "Section headings (H2)", "pass", "seo", `${h2Count} H2 heading${h2Count === 1 ? "" : "s"} structure the page.`)
      : item("h2", "Section headings (H2)", "attention", "seo", "No H2 headings — content may look flat to crawlers.", "Break content into sections with H2s.")
  );

  items.push(
    $('link[rel="canonical"]').attr("href")
      ? item("canonical", "Canonical URL", "pass", "seo", "Canonical URL is set.")
      : item("canonical", "Canonical URL", "fail", "seo", "No canonical URL.", 'Add <link rel="canonical" href="...">')
  );

  const robotsMeta = ($('meta[name="robots"]').attr("content") || "").toLowerCase();
  items.push(
    !robotsMeta.includes("noindex")
      ? item("robots-meta", "Robots meta allows indexing", "pass", "seo", robotsMeta ? `robots meta: ${robotsMeta}` : "No blocking robots meta.")
      : item("robots-meta", "Robots meta allows indexing", "fail", "seo", "Page is marked noindex.", "Remove noindex unless intentional.")
  );

  items.push(
    extras.isIndexable
      ? item("indexable", "Page is indexable", "pass", "seo", "Search engines may include this page.")
      : item("indexable", "Page is indexable", "fail", "seo", "Indexing appears blocked.", "Remove noindex / X-Robots-Tag blockers.")
  );

  items.push(
    hasRobotsTxt
      ? item("robots", "robots.txt", "pass", "seo", "robots.txt is reachable.")
      : item("robots", "robots.txt", "fail", "seo", "No robots.txt at site root.", "Add robots.txt at /robots.txt")
  );

  items.push(
    hasSitemap
      ? item("sitemap", "XML sitemap", "pass", "seo", "sitemap.xml found.")
      : item("sitemap", "XML sitemap", "fail", "seo", "No sitemap.xml found.", "Publish sitemap.xml and submit it in Search Console.")
  );

  items.push(
    $('link[rel="alternate"][hreflang]').length > 0
      ? item("hreflang", "Hreflang tags", "pass", "seo", "Hreflang alternates detected.")
      : item("hreflang", "Hreflang tags", "attention", "seo", "No hreflang — fine for single-language sites.", "Add hreflang if you serve multiple languages/regions.")
  );

  items.push(
    /breadcrumb|BreadcrumbList/i.test($.html())
      ? item("breadcrumbs", "Breadcrumbs", "pass", "seo", "Breadcrumb markup or links detected.")
      : item("breadcrumbs", "Breadcrumbs", "attention", "seo", "No breadcrumbs detected.", "Add breadcrumb navigation and BreadcrumbList schema.")
  );

  items.push(
    $('script[type="application/ld+json"]').length > 0
      ? item("schema", "Structured data present", "pass", "seo", "JSON-LD structured data found.")
      : item("schema", "Structured data present", "fail", "seo", "No structured data.", "Add JSON-LD for your content type.")
  );

  items.push(
    extras.hasValidSchema
      ? item("schema-valid", "Structured data valid", "pass", "seo", "Structured data parsed cleanly.")
      : item("schema-valid", "Structured data valid", "attention", "seo", "Structured data missing or has errors.", "Validate JSON-LD and include @context.")
  );

  items.push(
    extras.hasFaqSchema
      ? item("faq-schema", "FAQ schema", "pass", "seo", "FAQPage schema detected.")
      : item("faq-schema", "FAQ schema", "attention", "seo", "No FAQ schema.", "Add FAQPage JSON-LD if you have FAQs.")
  );

  items.push(
    extras.hasOrganizationSchema
      ? item("org-schema", "Organization schema", "pass", "seo", "Organization / LocalBusiness schema found.")
      : item("org-schema", "Organization schema", "attention", "seo", "No Organization schema.", "Add Organization or LocalBusiness JSON-LD.")
  );

  if (hasBacklinks) {
    items.push(
      backlinkCount && backlinkCount > 0
        ? item("backlinks", "Backlinks detected", "pass", "seo", `${backlinkCount} backlinks found.`)
        : item("backlinks", "Backlinks detected", "attention", "seo", "No backlinks in available data.", "Earn links with useful content and outreach.")
    );
  }

  // ——— Content ———
  const wordCount = countWords(ctx.fetchResult.html);
  items.push(
    wordCount >= 300
      ? item("content", "Content depth", "pass", "content", `${wordCount} words on the page.`)
      : wordCount >= 100
        ? item("content", "Content depth", "attention", "content", `Only ${wordCount} words.`, "Aim for 300+ useful words.")
        : item("content", "Content depth", "fail", "content", `Only ${wordCount} words — thin content.`, "Add substantial original content.")
  );

  const imgs = $("img");
  const imgsNoAlt = imgs.filter((_, el) => $(el).attr("alt") === undefined).length;
  items.push(
    imgs.length === 0
      ? item("alt", "Image alt text", "attention", "content", "No images on this page.")
      : imgsNoAlt === 0
        ? item("alt", "Image alt text", "pass", "content", "All images have alt attributes.")
        : item("alt", "Image alt text", "fail", "content", `${imgsNoAlt} of ${imgs.length} images missing alt.`, 'Add alt="…" to every image.')
  );

  items.push(
    extras.brokenImageCount === 0
      ? item("images-ok", "Images load", "pass", "content", "Checked images responded successfully.")
      : item("images-ok", "Images load", "fail", "content", `${extras.brokenImageCount} broken image(s).`, "Fix or replace broken image URLs.")
  );

  items.push(
    extras.brokenLinkCount === 0
      ? item("links", "Broken links", "pass", "content", "No broken links in the checked sample.")
      : item("links", "Broken links", "fail", "content", `${extras.brokenLinkCount} broken link(s).`, "Fix or remove links that error.")
  );

  const hasDates = $('time, meta[property="article:published_time"], meta[name="date"]').length > 0;
  items.push(
    hasDates
      ? item("dates", "Publish / update dates", "pass", "content", "Date markup found.")
      : item("dates", "Publish / update dates", "attention", "content", "No visible date markup.", "Add <time> or article:published_time for articles.")
  );

  items.push(
    $('meta[name="author"], a[rel="author"], [itemprop="author"]').length > 0
      ? item("author", "Author markup", "pass", "content", "Author information detected.")
      : item("author", "Author markup", "attention", "content", "No author markup.", "Add author meta or byline for editorial content.")
  );

  // ——— Technical ———
  items.push(
    baseUrl.startsWith("https://")
      ? item("https", "HTTPS", "pass", "technical", "Site served over HTTPS.")
      : item("https", "HTTPS", "fail", "technical", "Not using HTTPS.", "Install SSL and redirect HTTP → HTTPS.")
  );

  items.push(
    $('meta[name="viewport"]').attr("content")?.includes("width=device-width")
      ? item("viewport", "Mobile viewport", "pass", "technical", "Viewport meta is mobile-ready.")
      : item("viewport", "Mobile viewport", "fail", "technical", "Missing mobile viewport.", 'Add <meta name="viewport" content="width=device-width, initial-scale=1">')
  );

  items.push(
    $('link[rel="icon"], link[rel="shortcut icon"]').length > 0
      ? item("favicon", "Favicon", "pass", "technical", "Favicon link present.")
      : item("favicon", "Favicon", "fail", "technical", "No favicon.", "Add a favicon link in <head>.")
  );

  items.push(
    extras.hasManifest
      ? item("manifest", "Web app manifest", "pass", "technical", "manifest.json found.")
      : item("manifest", "Web app manifest", "attention", "technical", "No web app manifest.", "Add manifest.json for PWA / install support.")
  );

  items.push(
    extras.hasLlmsTxt
      ? item("llms", "llms.txt", "pass", "technical", "llms.txt present for AI crawlers.")
      : item("llms", "llms.txt", "attention", "technical", "No llms.txt.", "Add /llms.txt with guidance for AI systems.")
  );

  items.push(
    !extras.hasRedirectChain
      ? item("redirects", "No redirect chain", "pass", "technical", "URL resolves cleanly.")
      : item("redirects", "No redirect chain", "attention", "technical", "Multiple redirects before content.", "Collapse to a single 301 where possible.")
  );

  items.push(
    extras.wwwDuplicate
      ? item("www", "www consistency", "attention", "technical", "www and non-www both appear reachable.", "301-redirect to one preferred host.")
      : item("www", "www consistency", "pass", "technical", "No www / non-www conflict detected.")
  );

  const encoding = headers["content-encoding"] || "";
  items.push(
    encoding.includes("gzip") || encoding.includes("br") || encoding.includes("zstd")
      ? item("compression", "Compression", "pass", "technical", `Compression: ${encoding}.`)
      : item("compression", "Compression", "fail", "technical", "No gzip/Brotli detected.", "Enable compression on the server or CDN.")
  );

  const cache = headers["cache-control"] || headers["etag"] || headers["last-modified"];
  items.push(
    cache
      ? item("caching", "Caching headers", "pass", "technical", "Cache-related headers present.")
      : item("caching", "Caching headers", "attention", "technical", "No Cache-Control / ETag / Last-Modified.", "Add caching headers for static assets.")
  );

  items.push(
    $('link[rel="preconnect"], link[rel="dns-prefetch"]').length > 0
      ? item("preconnect", "Preconnect / DNS-prefetch", "pass", "technical", "Resource hints found.")
      : item("preconnect", "Preconnect / DNS-prefetch", "attention", "technical", "No preconnect hints.", "Add preconnect for critical third-party origins.")
  );

  items.push(
    $("img[loading='lazy'], img[loading=\"lazy\"]").length > 0 || imgs.length === 0
      ? item("lazy", "Image lazy-loading", "pass", "technical", imgs.length === 0 ? "No images to lazy-load." : "Lazy-loading used on images.")
      : item("lazy", "Image lazy-loading", "attention", "technical", "No loading=\"lazy\" on images.", "Lazy-load below-the-fold images.")
  );

  // ——— Social ———
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const ogUrl = $('meta[property="og:url"]').attr("content");

  items.push(
    ogTitle
      ? item("og-title", "Open Graph title", "pass", "social", "og:title is set.")
      : item("og-title", "Open Graph title", "fail", "social", "Missing og:title.", "Add og:title meta tag.")
  );
  items.push(
    ogDesc
      ? item("og-description", "Open Graph description", "pass", "social", "og:description is set.")
      : item("og-description", "Open Graph description", "fail", "social", "Missing og:description.", "Add og:description meta tag.")
  );
  items.push(
    ogImage
      ? item("og-image", "Open Graph image", "pass", "social", "og:image is set.")
      : item("og-image", "Open Graph image", "fail", "social", "Missing og:image.", "Add a 1200×630 social image.")
  );
  items.push(
    ogUrl
      ? item("og-url", "Open Graph URL", "pass", "social", "og:url is set.")
      : item("og-url", "Open Graph URL", "attention", "social", "Missing og:url.", "Add og:url matching the canonical.")
  );

  items.push(
    $('meta[name="twitter:card"]').attr("content")
      ? item("twitter-card", "Twitter card type", "pass", "social", "twitter:card is set.")
      : item("twitter-card", "Twitter card type", "fail", "social", "Missing twitter:card.", 'Add twitter:card = summary_large_image.')
  );
  items.push(
    $('meta[name="twitter:title"], meta[property="twitter:title"]').attr("content")
      ? item("twitter-title", "Twitter title", "pass", "social", "Twitter title present.")
      : item("twitter-title", "Twitter title", "attention", "social", "No twitter:title (may fall back to OG).", "Add twitter:title for X previews.")
  );
  items.push(
    $('meta[name="twitter:image"], meta[property="twitter:image"]').attr("content")
      ? item("twitter-image", "Twitter image", "pass", "social", "Twitter image present.")
      : item("twitter-image", "Twitter image", "attention", "social", "No twitter:image.", "Add twitter:image or rely on og:image.")
  );

  items.push(
    socialProfiles.length > 0
      ? item("social", "Social profile links", "pass", "social", `Found: ${socialProfiles.map((p) => p.platform).join(", ")}`)
      : item("social", "Social profile links", "attention", "social", "No social profile links on the page.", "Link social profiles in the footer.")
  );

  items.push(
    $('link[rel="apple-touch-icon"]').length > 0
      ? item("apple-icon", "Apple touch icon", "pass", "social", "Apple touch icon present.")
      : item("apple-icon", "Apple touch icon", "attention", "social", "No Apple touch icon.", 'Add <link rel="apple-touch-icon" …>.')
  );

  // ——— Security ———
  items.push(
    sslInfo.daysUntilExpiry !== undefined && sslInfo.daysUntilExpiry > 30
      ? item("ssl", "SSL certificate", "pass", "security", `Valid for ${sslInfo.daysUntilExpiry} more days.`)
      : sslInfo.daysUntilExpiry !== undefined && sslInfo.daysUntilExpiry > 0
        ? item("ssl", "SSL certificate", "attention", "security", `Expires in ${sslInfo.daysUntilExpiry} days.`)
        : item("ssl", "SSL certificate", "fail", "security", "SSL issue or expiry soon.", "Renew the certificate.")
  );

  const hasHsts = Boolean(headers["strict-transport-security"]);
  const hasFrame = Boolean(headers["x-frame-options"] || headers["content-security-policy"]?.includes("frame-ancestors"));
  const hasCto = Boolean(headers["x-content-type-options"]);
  const hasCsp = Boolean(headers["content-security-policy"]);
  const hasReferrer = Boolean(headers["referrer-policy"]);
  const hasPerms = Boolean(headers["permissions-policy"] || headers["feature-policy"]);

  items.push(
    hasHsts
      ? item("hsts", "HSTS header", "pass", "security", "Strict-Transport-Security present.")
      : item("hsts", "HSTS header", "fail", "security", "Missing HSTS.", "Add Strict-Transport-Security.")
  );
  items.push(
    hasFrame
      ? item("xfo", "Clickjacking protection", "pass", "security", "Frame restrictions present.")
      : item("xfo", "Clickjacking protection", "fail", "security", "No X-Frame-Options / frame-ancestors.", "Add X-Frame-Options or CSP frame-ancestors.")
  );
  items.push(
    hasCto
      ? item("xcto", "X-Content-Type-Options", "pass", "security", "nosniff is set.")
      : item("xcto", "X-Content-Type-Options", "attention", "security", "Missing X-Content-Type-Options.", "Add X-Content-Type-Options: nosniff.")
  );
  items.push(
    hasCsp
      ? item("csp", "Content-Security-Policy", "pass", "security", "CSP header present.")
      : item("csp", "Content-Security-Policy", "attention", "security", "No CSP header.", "Add a Content-Security-Policy.")
  );
  items.push(
    hasReferrer
      ? item("referrer", "Referrer-Policy", "pass", "security", "Referrer-Policy present.")
      : item("referrer", "Referrer-Policy", "attention", "security", "No Referrer-Policy.", "Add Referrer-Policy: strict-origin-when-cross-origin.")
  );
  items.push(
    hasPerms
      ? item("permissions", "Permissions-Policy", "pass", "security", "Permissions-Policy present.")
      : item("permissions", "Permissions-Policy", "attention", "security", "No Permissions-Policy.", "Restrict camera/mic/geolocation as needed.")
  );

  items.push(
    extras.hasMixedContent
      ? item("mixed", "No mixed content", "fail", "security", "HTTP assets on an HTTPS page.", "Upgrade all asset URLs to https://")
      : item("mixed", "No mixed content", "pass", "security", "No mixed HTTP content detected.")
  );

  items.push(
    extras.hasSecurityTxt
      ? item("security-txt", "security.txt", "pass", "security", "security.txt found.")
      : item("security-txt", "security.txt", "attention", "security", "No /.well-known/security.txt.", "Publish security.txt with a Contact field.")
  );

  // ——— Accessibility ———
  items.push(
    $("html").attr("lang")
      ? item("lang", "HTML lang", "pass", "accessibility", `lang="${$("html").attr("lang")}"`)
      : item("lang", "HTML lang", "fail", "accessibility", "No lang on <html>.", 'Add lang="en" (or your language).')
  );

  items.push(
    extras.hasMainLandmark
      ? item("main-landmark", "Main landmark", "pass", "accessibility", "<main> landmark present.")
      : item("main-landmark", "Main landmark", "attention", "accessibility", "No <main> element.", "Wrap primary content in <main>.")
  );

  items.push(
    $('a[href="#main"], a[href="#content"], .skip-link, a.skip').length > 0
      ? item("skip", "Skip link", "pass", "accessibility", "Skip-to-content link found.")
      : item("skip", "Skip link", "attention", "accessibility", "No skip link detected.", "Add a skip link as the first focusable element.")
  );

  const unlabeledInputs = $("input, select, textarea")
    .filter((_, el) => {
      const type = ($(el).attr("type") || "").toLowerCase();
      if (type === "hidden" || type === "submit" || type === "button") return false;
      const id = $(el).attr("id");
      const aria = $(el).attr("aria-label") || $(el).attr("aria-labelledby");
      if (aria) return false;
      if (id && $(`label[for="${id}"]`).length > 0) return false;
      return $(el).closest("label").length === 0;
    }).length;
  items.push(
    unlabeledInputs === 0
      ? item("forms", "Labeled form fields", "pass", "accessibility", "Form fields have labels.")
      : item("forms", "Labeled form fields", "fail", "accessibility", `${unlabeledInputs} unlabeled field(s).`, "Associate a <label> with each input.")
  );

  items.push(
    $("button, [role='button']").length === 0 ||
      $("button:not([aria-label]):not([aria-labelledby])")
        .filter((_, el) => !$(el).text().trim() && !$(el).attr("title"))
        .length === 0
      ? item("buttons", "Accessible buttons", "pass", "accessibility", "Buttons have accessible names.")
      : item("buttons", "Accessible buttons", "attention", "accessibility", "Some icon buttons lack accessible names.", "Add aria-label to icon-only buttons.")
  );

  // ——— Trust ———
  items.push(
    /privacy/i.test($.html())
      ? item("privacy", "Privacy policy", "pass", "trust", "Privacy policy link found.")
      : item("privacy", "Privacy policy", "fail", "trust", "No privacy policy link.", "Add a Privacy Policy in the footer.")
  );

  items.push(
    /terms|terms-of-service|terms-and-conditions|\/tos/i.test($.html())
      ? item("terms", "Terms of service", "pass", "trust", "Terms link found.")
      : item("terms", "Terms of service", "attention", "trust", "No terms link.", "Add Terms of Service if you have accounts or forms.")
  );

  items.push(
    /contact|about|get-in-touch/i.test($.html())
      ? item("contact", "Contact / About", "pass", "trust", "Contact or About path found.")
      : item("contact", "Contact / About", "fail", "trust", "No contact/about link.", "Add Contact or About in navigation.")
  );

  const hasCookieBanner =
    /cookie-consent|cookiebot|onetrust|cookiebanner|gdpr|iubenda|termly|osano|analytics cookies|uses cookies/i.test(
      $.html()
    );
  items.push(
    hasCookieBanner
      ? item("cookies", "Cookie notice", "pass", "trust", "Cookie / consent notice detected.")
      : item("cookies", "Cookie notice", "attention", "trust", "No cookie banner detected.", "Add consent UI if you use tracking cookies.")
  );

  items.push(
    domainInfo.daysUntilExpiry !== undefined && domainInfo.daysUntilExpiry > 30
      ? item("domain", "Domain registration", "pass", "trust", `Expires in ${domainInfo.daysUntilExpiry} days.`)
      : domainInfo.daysUntilExpiry !== undefined && domainInfo.daysUntilExpiry > 0
        ? item("domain", "Domain registration", "attention", "trust", `Domain expires in ${domainInfo.daysUntilExpiry} days.`)
        : item("domain", "Domain registration", "attention", "trust", "Could not verify domain expiry.")
  );

  if (checkEmailDns) {
    items.push(
      dnsInfo.hasSpf
        ? item("spf", "SPF record", "pass", "trust", "SPF DNS record present.")
        : item("spf", "SPF record", "fail", "trust", "No SPF record.", "Add an SPF TXT record.")
    );
    items.push(
      dnsInfo.hasDmarc
        ? item("dmarc", "DMARC record", "pass", "trust", "DMARC present.")
        : item("dmarc", "DMARC record", "fail", "trust", "No DMARC record.", "Add _dmarc TXT record.")
    );
    items.push(
      dnsInfo.hasDkim
        ? item("dkim", "DKIM record", "pass", "trust", "DKIM detected.")
        : item("dkim", "DKIM record", "attention", "trust", "No DKIM detected.", "Enable DKIM with your email provider.")
    );
  }

  // ——— Performance ———
  const responseMs = ctx.fetchResult.responseTimeMs;
  items.push(
    responseMs !== undefined && responseMs < 800
      ? item("speed", "Server response time", "pass", "performance", `Responded in ${responseMs}ms.`)
      : responseMs !== undefined && responseMs < 2000
        ? item("speed", "Server response time", "attention", "performance", `Responded in ${responseMs}ms.`)
        : item("speed", "Server response time", "fail", "performance", responseMs ? `Slow response: ${responseMs}ms.` : "Could not measure response time.", "Use faster hosting or a CDN.")
  );

  const htmlBytes = Buffer.byteLength(ctx.fetchResult.html || "", "utf8");
  items.push(
    htmlBytes < 200_000
      ? item("html-size", "HTML size", "pass", "performance", `HTML is ${(htmlBytes / 1024).toFixed(0)} KB.`)
      : item("html-size", "HTML size", "attention", "performance", `HTML is ${(htmlBytes / 1024).toFixed(0)} KB — quite large.`, "Reduce inline scripts/styles and unused markup.")
  );

  const scriptCount = $("script[src]").length;
  items.push(
    scriptCount <= 15
      ? item("scripts", "External scripts", "pass", "performance", `${scriptCount} external script(s).`)
      : item("scripts", "External scripts", "attention", "performance", `${scriptCount} external scripts — may hurt load time.`, "Defer non-critical JS and remove unused tags.")
  );

  const hasAnalytics = technologies.some((t) => t.category === "Analytics");
  items.push(
    hasAnalytics
      ? item("analytics", "Analytics installed", "pass", "performance", `Detected: ${technologies.filter((t) => t.category === "Analytics").map((t) => t.name).join(", ")}`)
      : item("analytics", "Analytics installed", "attention", "performance", "No analytics detected.", "Install GA4 or similar if you need traffic insights.")
  );

  const passCount = items.filter((i) => i.status === "pass").length;
  const failCount = items.filter((i) => i.status === "fail").length;
  const attentionCount = items.filter((i) => i.status === "attention").length;

  let summary: string;
  if (failCount === 0 && attentionCount === 0) {
    summary = `All ${items.length} checks passed on this page.`;
  } else if (failCount === 0) {
    summary = `${passCount} passed · ${attentionCount} need attention across ${items.length} checks.`;
  } else {
    summary = `${failCount} failed · ${attentionCount} need attention · ${passCount} passed (${items.length} checks).`;
  }

  return {
    passCount,
    failCount,
    attentionCount,
    hasCount: passCount,
    missingCount: failCount,
    warningCount: attentionCount,
    items,
    summary,
  };
}

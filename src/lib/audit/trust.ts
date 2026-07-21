import * as cheerio from "cheerio";
import { safeFetchText, safeHead } from "@/lib/fetcher";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const PRIVACY_PATTERNS = [/privacy/i, /privacy-policy/i, /datenschutz/i, /gdpr/i];
const TERMS_PATTERNS = [/terms/i, /terms-of-service/i, /terms-and-conditions/i, /legal/i, /tos/i];
const CONTACT_PATTERNS = [/contact/i, /about/i, /get-in-touch/i];

function hasLinkMatching($: cheerio.CheerioAPI, baseUrl: string, patterns: RegExp[]): boolean {
  let found = false;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    const combined = `${href} ${text}`;
    if (patterns.some((p) => p.test(combined))) {
      found = true;
      return false;
    }
  });
  return found;
}

export function runTrustAudit(ctx: AuditContext): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;

  const hasPrivacy = hasLinkMatching($, baseUrl, PRIVACY_PATTERNS);
  if (!hasPrivacy) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "No privacy policy link found",
        description:
          "Sites that collect user data (forms, analytics, cookies) should link to a privacy policy. Required under GDPR and CCPA.",
        recommendation: "Add a Privacy Policy link in your footer.",
        fixSnippet: '<a href="/privacy-policy">Privacy Policy</a>',
      })
    );
  }

  const hasTerms = hasLinkMatching($, baseUrl, TERMS_PATTERNS);
  const hasForms =
    $("form").length > 0 ||
    $("input[type=email], input[type=password]").length > 0;

  if (hasForms && !hasTerms) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No terms of service link found",
        description:
          "Sites with signup forms or user accounts should provide terms of service.",
        recommendation: "Add a Terms of Service link in your footer.",
        fixSnippet: '<a href="/terms">Terms of Service</a>',
      })
    );
  }

  const hasContact = hasLinkMatching($, baseUrl, CONTACT_PATTERNS);
  if (!hasContact) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No contact or about page link found",
        description:
          "Contact and about pages are trust signals for users and search engines (E-E-A-T).",
        recommendation: "Add Contact or About links in your navigation or footer.",
        fixSnippet: '<a href="/contact">Contact Us</a>',
      })
    );
  }

  return issues;
}

export async function runModernWebAudit(baseUrl: string): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const origin = new URL(baseUrl).origin;

  const manifest = await safeFetchText("/manifest.json", baseUrl);
  const manifestWebmanifest = await safeFetchText("/manifest.webmanifest", baseUrl);
  if (!manifest && !manifestWebmanifest) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No web app manifest found",
        description:
          "A manifest.json enables PWA features and controls how your site appears when installed on mobile.",
        recommendation: "Add a manifest.json for progressive web app support.",
        fixSnippet: `{
  "name": "Your Site Name",
  "short_name": "Site",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000"
}`,
      })
    );
  }

  const llmsTxt = await safeFetchText("/llms.txt", baseUrl);
  if (!llmsTxt) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No llms.txt file found",
        description:
          "llms.txt is an emerging standard that tells AI crawlers (ChatGPT, Perplexity) how to use your site content.",
        recommendation: "Add an llms.txt file at your site root.",
        fixSnippet: `# ${new URL(baseUrl).hostname}
> Description of your site for AI systems

## Docs
- [Homepage](${origin}/): Main entry point`,
      })
    );
  }

  return issues;
}

export async function runWwwConsistencyAudit(url: string): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const withWww = `https://www.${hostname}${parsed.pathname}`;
    const withoutWww = `https://${hostname}${parsed.pathname}`;

    const currentHasWww = parsed.hostname.startsWith("www.");
    const alternateUrl = currentHasWww ? withoutWww : withWww;
    const preferredHost = parsed.hostname.toLowerCase();

    const alternate = await safeHead(alternateUrl);
    if (!alternate.ok || alternate.status >= 400) return issues;

    let finalHost = "";
    try {
      finalHost = new URL(alternate.finalUrl).hostname.toLowerCase();
    } catch {
      finalHost = "";
    }

    // Redirecting the alternate host to the preferred host is the correct setup.
    if (finalHost && finalHost === preferredHost) return issues;

    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Both www and non-www versions accessible",
        description:
          "Having both versions live without redirects causes duplicate content. Pick one canonical version.",
        currentValue: `Both ${parsed.origin} and ${new URL(alternateUrl).origin} return HTTP ${alternate.status}`,
        recommendation: "301 redirect one version to the other and set a canonical URL.",
        fixSnippet: `# Redirect www to non-www (Nginx)
server {
  server_name www.example.com;
  return 301 https://example.com$request_uri;
}`,
      })
    );
  } catch {
    // skip if check fails
  }

  return issues;
}

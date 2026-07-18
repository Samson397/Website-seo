export type Guide = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  /** Checklist / issue ids this guide helps with */
  relatedCheckIds?: string[];
  body: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "title-tags",
    title: "Write title tags that rank and click",
    summary:
      "Aim for unique 50–60 character titles that name the page and the brand so searchers know exactly what they will get.",
    category: "SEO",
    relatedCheckIds: ["title", "title-length", "duplicate-title"],
    body: [
      "Every indexable page needs one unique <title>. Duplicate titles dilute rankings and confuse SERPs because Google cannot tell which URL should rank for a query.",
      "Put the primary keyword near the front, keep the brand at the end, and stay under ~60 characters so Google doesn’t truncate the promise you wrote.",
      "Write titles that match the H1 topic without stuffing. If the title says “pricing” and the H1 says something unrelated, both users and crawlers get mixed signals.",
      "After you change titles, re-scan with SEOHub to confirm the crawl picks up the new values across templates — especially paginated blogs and CMS defaults.",
      "Use the meta & SERP preview tool to judge click appeal before you ship, then verify site-wide uniqueness in a full audit.",
    ],
  },
  {
    slug: "meta-descriptions",
    title: "Meta descriptions that earn the click",
    summary:
      "Descriptions don’t rank directly — they win the SERP click when they clearly state the benefit in about 120–160 characters.",
    category: "SEO",
    relatedCheckIds: ["meta-description", "duplicate-description"],
    body: [
      "Write a unique meta description for each important page. Target 120–160 characters so snippets look complete in Google results.",
      "Lead with the benefit, include a soft call to action, and avoid stuffing keywords. Match the tone of the page intro so Google is less likely to rewrite you.",
      "Duplicate descriptions across tools or template pages make listings interchangeable. SEOHub flags those so you can prioritize high-traffic URLs first.",
      "If Google rewrites your snippet, tighten the on-page intro and ensure the description reflects visible content rather than marketing fluff alone.",
      "Preview candidates in the SERP tool, publish, then re-crawl to confirm the live HTML matches what you intended.",
    ],
  },
  {
    slug: "canonical-tags",
    title: "Canonical tags that prevent duplicates",
    summary:
      "Tell search engines which HTTPS URL is the preferred version of a page so parameter and trailing-slash variants do not compete.",
    category: "Technical",
    relatedCheckIds: ["canonical"],
    body: [
      "Add a self-referencing rel=canonical on every indexable page pointing at the preferred HTTPS URL — including the homepage.",
      "Use canonicals for query-param and trailing-slash variants. Don’t noindex pages you still want indexed; point variants at the clean URL instead.",
      "Avoid accidentally canonicalizing every page to the homepage. That pattern collapses rankings and is a common CMS misconfiguration SEOHub will surface.",
      "Keep www vs non-www and HTTP vs HTTPS consistent with redirects plus canonicals so signals reinforce one host.",
      "After fixing, crawl again and confirm “No canonical” and cross-canonical flags disappear in the site map panel.",
    ],
  },
  {
    slug: "security-headers",
    title: "Ship the security headers that matter",
    summary:
      "HSTS, CSP, frame protections, and Permissions-Policy protect users and strengthen trust signals on modern browsers.",
    category: "Security",
    relatedCheckIds: ["hsts", "csp", "x-frame-options"],
    body: [
      "Enable HSTS once HTTPS is solid across the whole host (includeSubDomains when every subdomain is ready).",
      "Start CSP in report-only, then tighten script-src and object-src until you can enforce without breaking ads or analytics you intentionally allow.",
      "Set X-Frame-Options or frame-ancestors, Referrer-Policy, X-Content-Type-Options, and Permissions-Policy as a baseline.",
      "Permissions-Policy is an easy win: disable camera, microphone, and geolocation if your product does not need them.",
      "Use SEOHub’s security headers checker for a quick live read, then confirm the same headers appear in a full-site audit.",
    ],
  },
  {
    slug: "broken-links",
    title: "Find and fix broken links",
    summary:
      "4xx and 5xx links waste crawl budget and frustrate visitors — catch them on key templates before they spread site-wide.",
    category: "Links",
    relatedCheckIds: ["broken-link"],
    body: [
      "Use SEOHub’s broken link tool on key templates (home, nav, footer, blog posts) after migrations or menu edits.",
      "Prefer updating the href to a live equivalent over deleting useful navigation. People and bots both follow those paths.",
      "For retired URLs, 301 to the best replacement — don’t leave soft 404s that return 200 with “not found” copy.",
      "Broken outbound links to partners or docs still hurt trust. Fix or remove them when the destination is gone for good.",
      "Re-run checks after publishing and keep a weekly habit via the watchlist so link rot does not accumulate unnoticed.",
    ],
  },
  {
    slug: "structured-data",
    title: "Add JSON-LD that Google understands",
    summary:
      "Organization, WebSite, and BreadcrumbList cover most marketing sites and help AI assistants ground your brand entity.",
    category: "SEO",
    relatedCheckIds: ["schema", "json-ld"],
    body: [
      "Start with Organization + WebSite on the homepage, then BreadcrumbList on inner pages. Add FAQPage where you answer real questions.",
      "Include name, url, and logo on Organization markup so AI answer engines can recognize the brand entity more reliably.",
      "Keep JSON valid — a single trailing comma can invalidate the whole block and silently drop rich-result eligibility.",
      "Validate with SEOHub’s schema tool, then confirm rich-result eligibility in Google’s tester when you go live.",
      "Re-scan after deploy: structured data issues often appear as AI visibility gaps even when classic SEO scores look fine.",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

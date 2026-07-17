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
    summary: "Aim for unique 50–60 character titles that name the page and the brand.",
    category: "SEO",
    relatedCheckIds: ["title", "title-length", "duplicate-title"],
    body: [
      "Every indexable page needs one unique <title>. Duplicate titles dilute rankings and confuse SERPs.",
      "Put the primary keyword near the front, keep the brand at the end, and stay under ~60 characters so Google doesn’t truncate.",
      "After you change titles, re-scan with SEOScan to confirm the crawl picks up the new values across the site.",
    ],
  },
  {
    slug: "meta-descriptions",
    title: "Meta descriptions that earn the click",
    summary: "Descriptions don’t rank directly — they win the SERP click.",
    category: "SEO",
    relatedCheckIds: ["meta-description", "duplicate-description"],
    body: [
      "Write a unique meta description for each important page. Target 120–160 characters.",
      "Lead with the benefit, include a soft call to action, and avoid stuffing keywords.",
      "If Google rewrites your snippet, tighten the on-page intro so the description matches visible content.",
    ],
  },
  {
    slug: "canonical-tags",
    title: "Canonical tags that prevent duplicates",
    summary: "Tell search engines which URL is the preferred version of a page.",
    category: "Technical",
    relatedCheckIds: ["canonical"],
    body: [
      "Add a self-referencing rel=canonical on every indexable page pointing at the preferred HTTPS URL.",
      "Use canonicals for query-param and trailing-slash variants — don’t noindex pages you still want indexed.",
      "After fixing, crawl again and confirm “No canonical” flags disappear in the site map panel.",
    ],
  },
  {
    slug: "security-headers",
    title: "Ship the security headers that matter",
    summary: "HSTS, CSP, and frame protections protect users and boost trust signals.",
    category: "Security",
    relatedCheckIds: ["hsts", "csp", "x-frame-options"],
    body: [
      "Enable HSTS once HTTPS is solid across the whole host (includeSubDomains when ready).",
      "Start CSP in report-only, then tighten script-src and object-src until you can enforce.",
      "Set X-Frame-Options or frame-ancestors, Referrer-Policy, and Permissions-Policy as a baseline.",
    ],
  },
  {
    slug: "broken-links",
    title: "Find and fix broken links",
    summary: "4xx/5xx links waste crawl budget and frustrate visitors.",
    category: "Links",
    relatedCheckIds: ["broken-link"],
    body: [
      "Use SEOScan’s broken link tool on key templates (home, nav, footer, blog posts).",
      "Prefer updating the href to a live equivalent over deleting useful navigation.",
      "For retired URLs, 301 to the best replacement — don’t leave soft 404s.",
    ],
  },
  {
    slug: "structured-data",
    title: "Add JSON-LD that Google understands",
    summary: "Organization, WebSite, and BreadcrumbList cover most marketing sites.",
    category: "SEO",
    relatedCheckIds: ["schema", "json-ld"],
    body: [
      "Start with Organization + WebSite on the homepage, then BreadcrumbList on inner pages.",
      "Keep JSON valid — a single trailing comma can invalidate the whole block.",
      "Validate with the schema tool, then confirm rich-result eligibility in Google’s tester when you go live.",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Public Technical SEO Checklist lead magnet — aligned with SEOHub scan themes. */

export type ChecklistItem = {
  id: string;
  label: string;
  hint: string;
};

export type ChecklistSection = {
  id: string;
  title: string;
  summary: string;
  items: ChecklistItem[];
};

export const TECHNICAL_SEO_CHECKLIST_TITLE = "Technical SEO Checklist";
export const TECHNICAL_SEO_CHECKLIST_SUBTITLE =
  "A practical pass you can run before (or after) a full-site scan — crawl access, on-page basics, performance signals, and trust headers.";

export const TECHNICAL_SEO_CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: "crawl-index",
    title: "Crawl & indexation",
    summary: "If search engines cannot discover or index key URLs, on-page work will not help.",
    items: [
      {
        id: "https",
        label: "HTTPS everywhere",
        hint: "Serve the preferred host over HTTPS and redirect HTTP → HTTPS.",
      },
      {
        id: "www",
        label: "One preferred host (www or non-www)",
        hint: "301-redirect the alternate host so only one version is indexable.",
      },
      {
        id: "robots",
        label: "robots.txt is reachable and sane",
        hint: "Allow important paths; do not Disallow templates you want ranked.",
      },
      {
        id: "sitemap",
        label: "XML sitemap published",
        hint: "Ship /sitemap.xml (or sitemap index) and submit it in Search Console.",
      },
      {
        id: "noindex",
        label: "No accidental noindex on money pages",
        hint: "Check robots meta and X-Robots-Tag on home, product, and blog templates.",
      },
      {
        id: "canonical",
        label: "Self-referencing canonicals",
        hint: "Each indexable page points at its preferred HTTPS URL.",
      },
      {
        id: "redirects",
        label: "No long redirect chains",
        hint: "Collapse multi-hop redirects to a single 301 where possible.",
      },
    ],
  },
  {
    id: "on-page",
    title: "On-page & structure",
    summary: "Unique titles, clear headings, and structured data make templates crawlable and clickable.",
    items: [
      {
        id: "title",
        label: "Unique title tags (≈50–60 characters)",
        hint: "Primary topic near the front; brand at the end; one title per URL.",
      },
      {
        id: "meta-description",
        label: "Unique meta descriptions (≈120–160 characters)",
        hint: "Benefit-led copy that matches the visible intro — earns the SERP click.",
      },
      {
        id: "h1",
        label: "One clear H1 per page",
        hint: "Use H2s for sections; avoid duplicate or missing H1s on templates.",
      },
      {
        id: "schema",
        label: "Valid JSON-LD for key types",
        hint: "Start with Organization + WebSite on the home URL; BreadcrumbList on inner pages.",
      },
      {
        id: "hreflang",
        label: "Hreflang when you serve multiple locales",
        hint: "Skip if single-language; otherwise pair alternates both ways.",
      },
      {
        id: "internal-links",
        label: "Important pages linked in HTML",
        hint: "Reach key URLs via real <a href> links — not PDF-only or JS-only nav.",
      },
    ],
  },
  {
    id: "content-quality",
    title: "Content & crawl waste",
    summary: "Thin pages and broken assets burn budget and frustrate visitors.",
    items: [
      {
        id: "thin",
        label: "Enough original content on key templates",
        hint: "Aim for useful depth (often 300+ words) on pages you want to rank.",
      },
      {
        id: "broken-links",
        label: "No broken internal links (4xx/5xx)",
        hint: "Fix nav, footer, and blog templates first — they multiply across the site.",
      },
      {
        id: "images",
        label: "Images load and have alt text",
        hint: "Replace broken image URLs; add descriptive alt on meaningful images.",
      },
      {
        id: "duplicates",
        label: "No duplicate titles / thin near-duplicates",
        hint: "Consolidate or differentiate query-param and printer-friendly variants.",
      },
    ],
  },
  {
    id: "performance",
    title: "Performance signals",
    summary: "Technical speed basics that crawlers and users both notice.",
    items: [
      {
        id: "viewport",
        label: "Mobile viewport meta",
        hint: 'Include width=device-width, initial-scale=1.',
      },
      {
        id: "compression",
        label: "Gzip or Brotli compression",
        hint: "Enable at the CDN or origin for HTML and text assets.",
      },
      {
        id: "caching",
        label: "Caching headers on static assets",
        hint: "Cache-Control / ETag / Last-Modified for CSS, JS, and images.",
      },
      {
        id: "lazy",
        label: "Lazy-load below-the-fold images",
        hint: 'Use loading="lazy" where appropriate; keep LCP image eager.',
      },
      {
        id: "preconnect",
        label: "Preconnect critical third parties",
        hint: "Hint fonts, analytics, or CDN origins you always load.",
      },
    ],
  },
  {
    id: "trust",
    title: "Trust & security headers",
    summary: "HTTPS alone is not enough — ship a sensible header baseline.",
    items: [
      {
        id: "ssl",
        label: "Valid SSL certificate (not expiring soon)",
        hint: "Renew before expiry; watch intermediate chain issues.",
      },
      {
        id: "hsts",
        label: "Strict-Transport-Security (HSTS)",
        hint: "Enable once HTTPS is solid across the host.",
      },
      {
        id: "xfo",
        label: "Clickjacking protection",
        hint: "X-Frame-Options or CSP frame-ancestors.",
      },
      {
        id: "csp",
        label: "Content-Security-Policy (or report-only start)",
        hint: "Tighten script-src gradually; avoid blocking critical first-party scripts.",
      },
      {
        id: "mixed",
        label: "No mixed content",
        hint: "Upgrade HTTP asset URLs on HTTPS pages.",
      },
      {
        id: "og",
        label: "Open Graph / social preview tags",
        hint: "og:title, og:description, and a 1200×630 og:image on shareable URLs.",
      },
    ],
  },
];

export function checklistItemCount(): number {
  return TECHNICAL_SEO_CHECKLIST_SECTIONS.reduce((n, s) => n + s.items.length, 0);
}

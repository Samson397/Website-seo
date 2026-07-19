/** App routes — single source of truth for pages and nav */
export const routes = {
  home: "/",
  history: "/history",
  tracker: "/tracker",
  competitors: "/competitors",
  sampleReport: "/r/sample",
  tools: "/tools",
  metaPreview: "/tools/meta-preview",
  robotsInspector: "/tools/robots",
  headers: "/tools/headers",
  redirects: "/tools/redirects",
  schema: "/tools/schema",
  brokenLinks: "/tools/broken-links",
  keywords: "/tools/keywords",
  rankChecker: "/tools/rank-checker",
  contentOptimizer: "/tools/content",
  sitemapGenerator: "/tools/sitemap-generator",
  robotsGenerator: "/tools/robots-generator",
  guides: "/guides",
  blog: "/blog",
  compare: "/compare",
  compareAhrefs: "/compare/seohub-vs-ahrefs",
  compareSemrush: "/compare/seohub-vs-semrush",
  compareUbersuggest: "/compare/seohub-vs-ubersuggest",
  compareFreeCheckers: "/compare/seohub-vs-free-seo-checkers",
  compareBestFree: "/compare/best-free-seo-tools",
  audit: "/audit",
  technicalSeoChecklist: "/checklist/technical-seo",
  pricing: "/pricing",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export const mainNav = [
  {
    href: routes.home,
    label: "Scan",
    description: "Full-site crawl with 50+ SEO, security & speed checks",
  },
  {
    href: routes.history,
    label: "History",
    description: "Recent scans, watchlist, and weekly re-check reminders",
  },
  {
    href: routes.tracker,
    label: "Keywords",
    description: "Track target keywords and on-page rank signals on this device",
  },
  {
    href: routes.competitors,
    label: "Compare",
    description: "Audit up to 10 competitor URLs side by side",
  },
  {
    href: routes.tools,
    label: "Tools",
    description: "Keywords, content, generators, redirects, schema, and more",
  },
  {
    href: routes.pricing,
    label: "Pricing",
    description: "Free preview vs $0.99 per full-site scan",
  },
] as const;

/** Build a home URL that starts a scan for the given site. */
export function scanUrlFor(url: string, unlockSessionId?: string): string {
  const params = new URLSearchParams();
  if (url.trim()) params.set("url", url.trim());
  if (unlockSessionId) params.set("unlock_session", unlockSessionId);
  const q = params.toString();
  return q ? `${routes.home}?${q}` : routes.home;
}

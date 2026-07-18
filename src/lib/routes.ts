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
  pricing: "/pricing",
  about: "/about",
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
  const params = new URLSearchParams({ url });
  if (unlockSessionId) params.set("unlock_session", unlockSessionId);
  return `${routes.home}?${params.toString()}`;
}

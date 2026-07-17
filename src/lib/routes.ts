/** App routes — single source of truth for pages and nav */
export const routes = {
  home: "/",
  competitors: "/competitors",
  tools: "/tools",
  metaPreview: "/tools/meta-preview",
  robotsInspector: "/tools/robots",
  headers: "/tools/headers",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export const mainNav = [
  {
    href: routes.home,
    label: "Full site scan",
    description: "Crawl every page and run 50+ SEO, security & speed checks",
  },
  {
    href: routes.competitors,
    label: "Compare sites",
    description: "Audit up to 10 competitor URLs side by side",
  },
  {
    href: routes.tools,
    label: "Free tools",
    description: "Meta preview, robots/sitemap inspector, security headers",
  },
] as const;

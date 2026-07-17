/** App routes — single source of truth for pages and nav */
export const routes = {
  home: "/",
  history: "/history",
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
    label: "Scan",
    description: "Full-site crawl with 50+ SEO, security & speed checks",
  },
  {
    href: routes.history,
    label: "History",
    description: "Recent scans and watchlist saved on this device",
  },
  {
    href: routes.competitors,
    label: "Compare",
    description: "Audit up to 10 competitor URLs side by side",
  },
  {
    href: routes.tools,
    label: "Tools",
    description: "Meta preview, robots/sitemap inspector, security headers",
  },
] as const;

/** Build a home URL that starts a scan for the given site. */
export function scanUrlFor(url: string): string {
  return `${routes.home}?url=${encodeURIComponent(url)}`;
}

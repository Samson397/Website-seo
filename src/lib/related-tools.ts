import { routes } from "@/lib/routes";
import type { RelatedToolLink } from "@/components/tools/RelatedTools";

/** Sensible related-tool sets keyed by tool route. */
export const RELATED_BY_TOOL = {
  keywords: [
    {
      href: routes.rankChecker,
      title: "Rank checker",
      description: "Score on-page fit for a target keyword.",
    },
    {
      href: routes.contentOptimizer,
      title: "Content optimizer",
      description: "Tighten copy against a primary phrase.",
    },
    {
      href: routes.tracker,
      title: "Keyword tracker",
      description: "Save keywords on this device and re-check later.",
    },
    {
      href: routes.metaPreview,
      title: "Meta & SERP preview",
      description: "Preview how titles and descriptions may look in Google.",
    },
  ],
  headers: [
    {
      href: routes.redirects,
      title: "Redirect chain",
      description: "Follow hops to the final HTTPS URL.",
    },
    {
      href: routes.robotsInspector,
      title: "robots.txt & sitemap",
      description: "Confirm crawlers can reach the right paths.",
    },
    {
      href: routes.brokenLinks,
      title: "Broken link checker",
      description: "Probe outbound links for 4xx/5xx failures.",
    },
    {
      href: routes.schema,
      title: "JSON-LD schema",
      description: "Extract structured data blocks from the page.",
    },
  ],
  schema: [
    {
      href: routes.metaPreview,
      title: "Meta & SERP preview",
      description: "Tune title and description alongside schema.",
    },
    {
      href: routes.brokenLinks,
      title: "Broken link checker",
      description: "Catch dead URLs that waste crawl budget.",
    },
    {
      href: routes.contentOptimizer,
      title: "Content optimizer",
      description: "Align on-page copy with the entities you declare.",
    },
    {
      href: routes.headers,
      title: "Security headers",
      description: "Check HSTS, CSP, and frame protections.",
    },
  ],
  redirects: [
    {
      href: routes.headers,
      title: "Security headers",
      description: "Confirm HSTS and related headers on the final host.",
    },
    {
      href: routes.brokenLinks,
      title: "Broken link checker",
      description: "Find links that never land cleanly.",
    },
    {
      href: routes.robotsInspector,
      title: "robots.txt & sitemap",
      description: "See whether redirects align with crawl rules.",
    },
    {
      href: routes.schema,
      title: "JSON-LD schema",
      description: "Inspect structured data on the destination page.",
    },
  ],
  brokenLinks: [
    {
      href: routes.redirects,
      title: "Redirect chain",
      description: "Check whether soft 404s hide behind redirects.",
    },
    {
      href: routes.schema,
      title: "JSON-LD schema",
      description: "Validate structured data on key templates.",
    },
    {
      href: routes.headers,
      title: "Security headers",
      description: "Quick security header presence check.",
    },
    {
      href: routes.robotsInspector,
      title: "robots.txt & sitemap",
      description: "Confirm sitemap coverage after link fixes.",
    },
  ],
  robots: [
    {
      href: routes.robotsGenerator,
      title: "robots.txt generator",
      description: "Draft a starter robots.txt with sitemap rules.",
    },
    {
      href: routes.sitemapGenerator,
      title: "Sitemap generator",
      description: "Build a downloadable sitemap.xml from a URL list.",
    },
    {
      href: routes.headers,
      title: "Security headers",
      description: "Check response headers on the same host.",
    },
    {
      href: routes.redirects,
      title: "Redirect chain",
      description: "Follow canonical and www/non-www hops.",
    },
  ],
} as const satisfies Record<string, RelatedToolLink[]>;

export type RelatedToolKey = keyof typeof RELATED_BY_TOOL;

import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";

const TOOLS = [
  {
    href: routes.metaPreview,
    title: "Meta & SERP preview",
    description: "Edit title and description live and see Google-style and social card previews.",
  },
  {
    href: routes.robotsInspector,
    title: "robots.txt & sitemap",
    description: "Fetch and inspect robots rules, sitemap URLs, and obvious crawl blockers.",
  },
  {
    href: routes.headers,
    title: "Security headers",
    description: "Check HSTS, CSP, X-Frame-Options, Referrer-Policy, and related headers.",
  },
  {
    href: routes.redirects,
    title: "Redirect chain",
    description: "Follow every hop to the final URL — catch loops and mixed HTTP.",
  },
  {
    href: routes.schema,
    title: "JSON-LD schema",
    description: "Extract structured data types and validate JSON-LD blocks.",
  },
  {
    href: routes.brokenLinks,
    title: "Broken link checker",
    description: "Probe outbound links on a page for 4xx/5xx failures.",
  },
  {
    href: routes.competitors,
    title: "Competitor compare",
    description: "Audit up to 10 sites side by side and rank them by overall score.",
  },
  {
    href: routes.guides,
    title: "Fix guides",
    description: "Short how-tos for the most common SEOScan fails.",
  },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Free tools"
        title="Extra utilities. Same engine."
        description="Lightweight SEO helpers — no account, no paywall."
      />

      <div className="mx-auto mt-10 grid max-w-6xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group border-t border-ink/10 pt-5 transition hover:border-teal"
          >
            <h2 className="font-display text-xl font-semibold text-ink group-hover:text-teal">
              {tool.title}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">{tool.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

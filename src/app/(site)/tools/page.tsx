import Link from "next/link";
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
    href: routes.competitors,
    title: "Competitor compare",
    description: "Audit up to 10 sites side by side and rank them by overall score.",
  },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen pb-16">
      <section className="hero-mesh px-4 pb-14 pt-28 text-white sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-bright">
            Free tools
          </p>
          <h1 className="font-display mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Extra utilities. Same engine.
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Lightweight SEO helpers — no account, no paywall.
          </p>
        </div>
      </section>

      <div className="mx-auto mt-10 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 sm:px-6">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group border-t-2 border-teal/30 pt-5 transition hover:border-teal"
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

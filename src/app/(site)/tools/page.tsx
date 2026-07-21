import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { PLATFORM_AUDITS, platformAuditPath } from "@/lib/platform-audits";
import { pageMetadata } from "@/lib/page-seo";
import { routes } from "@/lib/routes";

export const metadata = pageMetadata({
  title: "Free SEO tools — SEOHub",
  description:
    "Free SEO toolkit: keyword research, meta preview, robots and sitemap inspectors, security headers, redirects, schema, broken links, and generators. No account required.",
  path: "/tools",
});

const TOOL_GROUPS = [
  {
    label: "Research & tracking",
    tools: [
      {
        href: routes.keywords,
        title: "Keyword research",
        description: "Volume, CPC, intent, clusters, and page-type recommendations.",
      },
      {
        href: routes.rankChecker,
        title: "Rank checker",
        description: "On-page keyword score and optional Google position via DataForSEO.",
      },
      {
        href: routes.contentOptimizer,
        title: "Content optimizer",
        description: "Score copy against a target keyword with actionable fixes.",
      },
      {
        href: routes.articleWriter,
        title: "AI article writer",
        description: "Generate title, outline, article, FAQs, schema, and internal links.",
      },
      {
        href: routes.tracker,
        title: "Keyword tracker",
        description: "Save keywords on this device and optional weekly email ranks.",
      },
    ],
  },
  {
    label: "Technical & on-page",
    tools: [
      {
        href: routes.metaPreview,
        title: "Meta & SERP preview",
        description: "Edit title and description live and preview Google-style results.",
      },
      {
        href: routes.robotsInspector,
        title: "robots.txt & sitemap inspector",
        description: "Fetch robots rules and sitemap URL counts.",
      },
      {
        href: routes.headers,
        title: "Security headers",
        description: "HSTS, CSP, X-Frame-Options, Referrer-Policy, and more.",
      },
      {
        href: routes.redirects,
        title: "Redirect chain",
        description: "Follow hops to the final URL.",
      },
      {
        href: routes.schema,
        title: "JSON-LD schema",
        description: "Extract and validate structured data blocks.",
      },
      {
        href: routes.brokenLinks,
        title: "Broken link checker",
        description: "Probe outbound links for 4xx/5xx failures.",
      },
    ],
  },
  {
    label: "Generators",
    tools: [
      {
        href: routes.sitemapGenerator,
        title: "Sitemap generator",
        description: "Build a downloadable sitemap.xml from a URL list.",
      },
      {
        href: routes.robotsGenerator,
        title: "robots.txt generator",
        description: "Create a starter robots.txt with sitemap and disallow rules.",
      },
    ],
  },
  {
    label: "Compare & learn",
    tools: [
      {
        href: routes.competitors,
        title: "Competitor compare",
        description: "Side-by-side audits plus sitemap page-gap findings.",
      },
      {
        href: routes.compare,
        title: "SEOHub vs other tools",
        description: "Honest comparisons with Ahrefs, Semrush, and free checkers.",
      },
      {
        href: routes.guides,
        title: "Fix guides",
        description: "Short how-tos for common audit failures.",
      },
    ],
  },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="SEOHub toolkit"
        title="Audit, research, optimize, generate."
        description="Free tools with no account — built to sit next to your weekly site scan."
        actions={
          <Link
            href={routes.home}
            className="inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-ink-soft"
          >
            Run free homepage scan
          </Link>
        }
      />

      <SeoPageIntro heading="A free toolkit next to your weekly audit">
        <p>
          Every SEOHub tool is built to answer a specific question from a full-site scan: Are titles
          and descriptions click-worthy? Is robots.txt blocking the wrong paths? Do security headers
          and redirects look clean? Use these utilities without a login, then run a homepage preview
          or paid crawl when you need the complete picture.
        </p>
      </SeoPageIntro>

      <div className="mx-auto mt-10 max-w-6xl space-y-14 px-4 sm:px-6">
        {TOOL_GROUPS.map((group) => (
          <section key={group.label}>
            <h2 className="font-display text-xl font-semibold text-ink">{group.label}</h2>
            <div className="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group border-t border-ink/10 pt-4 transition hover:border-brand"
                >
                  <h3 className="font-display text-lg font-semibold text-ink group-hover:text-brand">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Audits by platform</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Platform-specific SEO checklists for common CMS and ecommerce stacks — then run a free
            homepage scan.
          </p>
          <div className="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_AUDITS.map((audit) => (
              <Link
                key={audit.slug}
                href={platformAuditPath(audit.slug)}
                className="group border-t border-ink/10 pt-4 transition hover:border-brand"
              >
                <h3 className="font-display text-lg font-semibold text-ink group-hover:text-brand">
                  {audit.shortName} SEO audit
                </h3>
                <p className="mt-2 text-sm text-ink-muted">{audit.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

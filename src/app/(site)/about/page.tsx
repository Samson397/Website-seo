import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "About — SEOHub",
  description: "Why SEOHub: full-site SEO audits, free tools, and a one-time unlock — no account.",
};

const GAPS_SHIPPED = [
  "Full-site crawl up to 200 pages from sitemap + internal links",
  "50+ Pass / Fail / Review checks on SEO, security, a11y, and speed signals",
  "Keyword research, rank checker, content optimizer, local tracker",
  "Redirects, schema, broken links, headers, robots/sitemap tools",
  "Shareable reports, exports, optional email digests",
  "Competitor homepage compare",
];

const NEXT_UP = [
  "Crawl controls (max pages, include/exclude paths)",
  "Issue grouping by URL template (/blog/*, /products/*)",
  "Internal link depth + orphan-page signals",
  "Site-wide redirect / canonical / hreflang coverage",
  "Richer competitor gap (titles, content length, top issues)",
  "Public sample report for demos",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="About SEOHub"
        title="A weekly site check, without the SaaS."
        description="SEOHub crawls public HTML and runs clear checks — free to start, no account, pay once when you need the deep crawl."
        actions={
          <>
            <PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>
            <SecondaryCta href={routes.pricing}>See pricing</SecondaryCta>
          </>
        }
      />

      <article className="mx-auto mt-12 max-w-3xl space-y-12 px-4 text-ink-muted sm:px-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">How it works</h2>
          <p className="mt-2 leading-relaxed">
            Paste a URL. We discover pages from your sitemap and internal links, then check titles,
            descriptions, headings, canonicals, and HTTP status. The homepage also gets a deep audit
            of technical SEO, security headers, DNS, and more — with plain-English fixes.
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Scans use fetched HTML (not a full browser render). That keeps SEOHub fast and cheap —
            and honest about JS-heavy apps.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Built to beat bloated SEO suites</h2>
          <p className="mt-2 leading-relaxed">
            Ahrefs and Semrush win on backlink graphs and enterprise research. Screaming Frog wins on
            desktop crawl control. SEOHub aims to be the #1 browser-first weekly audit: clear
            Pass/Fail, freemium unlock, and a toolkit that ships without login walls.
          </p>
          <ul className="mt-4 space-y-2">
            {GAPS_SHIPPED.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-brand">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Still leveling up</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Honest backlog versus top SEO products — shipping these next keeps the product focused:
          </p>
          <ul className="mt-4 space-y-2">
            {NEXT_UP.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-ink/30">○</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Also free</h2>
          <ul className="mt-3 space-y-2">
            {[
              { href: routes.competitors, label: "Competitor compare" },
              { href: routes.metaPreview, label: "Meta & SERP preview" },
              { href: routes.redirects, label: "Redirect chain checker" },
              { href: routes.schema, label: "JSON-LD schema inspector" },
              { href: routes.brokenLinks, label: "Broken link checker" },
              { href: routes.guides, label: "Fix guides" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-brand hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

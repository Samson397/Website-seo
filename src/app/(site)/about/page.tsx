import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "About — SEOHub",
  description: "About the free SEOHub full-site audit tool.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="About"
        title="A weekly site check, without the SaaS."
        description="SEOHub crawls public websites and runs 50+ checks — free, no account, no email collection."
        actions={
          <>
            <PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>
            <SecondaryCta href={routes.tools}>Browse tools</SecondaryCta>
          </>
        }
      />

      <article className="mx-auto mt-10 max-w-2xl space-y-8 px-4 text-ink-muted sm:px-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">How it works</h2>
          <p className="mt-2 leading-relaxed">
            Paste a URL and we discover pages from your sitemap and internal links, then check each
            one for titles, descriptions, headings, canonicals, and HTTP status. The homepage also
            gets a deep audit of technical SEO, security headers, DNS, and more — with
            plain-English fixes.
          </p>
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
                <Link href={item.href} className="text-teal hover:underline">
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

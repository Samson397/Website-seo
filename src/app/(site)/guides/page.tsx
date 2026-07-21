import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";
import { GUIDES } from "@/lib/guides";

export const metadata = {
  title: "SEO fix guides for common check failures",
  description:
    "Practical guides for the most common SEOHub check failures — titles, meta descriptions, canonicals, security headers, broken links, and structured data. Free, no account.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Guides"
        title="Fix what the scan finds."
        description="Plain-English steps for titles, canonicals, security headers, and more."
        actions={
          <>
            <PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>
            <SecondaryCta href={routes.technicalSeoChecklist}>Technical checklist</SecondaryCta>
          </>
        }
      />

      <article className="mx-auto mt-10 max-w-3xl space-y-6 px-4 text-ink-muted sm:px-6">
        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-display text-xl font-semibold text-ink">How to use these guides</h2>
          <p>
            Each guide maps to failures SEOHub flags in a free homepage preview or paid full-site
            crawl. Start with indexation and titles, then move to redirects, security headers, and
            structured data. Fix templates once whenever the same issue repeats across URLs.
          </p>
          <p>
            After you ship a change, re-scan to confirm the checklist moves. Pair guides with free
            tools — meta preview, robots inspector, schema checker, and broken-link sampling — then
            unlock a full crawl when you need sitewide coverage.
          </p>
        </section>

        <div className="space-y-6">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`${routes.guides}/${guide.slug}`}
              className="block border-t border-ink/10 pt-5 transition hover:border-teal"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                {guide.category}
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-ink">{guide.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{guide.summary}</p>
            </Link>
          ))}
        </div>

        <section className="space-y-3 border-t border-ink/10 pt-6 text-sm leading-relaxed">
          <h2 className="font-display text-xl font-semibold text-ink">Keep going</h2>
          <p>
            Want a printable pass before you scan? Use the{" "}
            <Link
              href={routes.technicalSeoChecklist}
              className="font-medium text-teal hover:underline"
            >
              Technical SEO Checklist
            </Link>
            . Prefer longer articles?{" "}
            <Link href={routes.blog} className="font-medium text-teal hover:underline">
              Read the blog
            </Link>
            . Comparing tools? See{" "}
            <Link href={routes.compare} className="font-medium text-teal hover:underline">
              SEOHub comparisons
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

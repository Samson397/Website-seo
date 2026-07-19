import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { COMPARE_INDEX, COMPARE_PAGES, comparePath } from "@/lib/compare-pages";
import { pageMetadata } from "@/lib/page-seo";
import { routes } from "@/lib/routes";

export const metadata = pageMetadata({
  title: "SEOHub comparisons — vs Ahrefs, Semrush & free checkers",
  description: COMPARE_INDEX.description,
  path: routes.compare,
});

export default function CompareIndexPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Compare"
        title={COMPARE_INDEX.title}
        description={COMPARE_INDEX.description}
        actions={
          <>
            <PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>
            <SecondaryCta href={routes.pricing}>See pricing</SecondaryCta>
          </>
        }
      />

      <div className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        <p className="text-sm leading-relaxed text-ink-muted">
          SEOHub is a <strong className="font-medium text-ink">browser-first weekly audit</strong>{" "}
          with pay-per-scan unlocks — not a backlink database. These pages say so plainly so you can
          pick the right tool for the job.
        </p>

        <ul className="mt-10 space-y-6">
          {COMPARE_PAGES.map((page) => (
            <li key={page.slug}>
              <Link
                href={comparePath(page.slug)}
                className="group block border-t border-ink/10 pt-4 transition hover:border-brand"
              >
                <h2 className="font-display text-lg font-semibold text-ink group-hover:text-brand">
                  {page.title}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">{page.positioning}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import {
  COMPARE_PAGES,
  comparePath,
  getComparePage,
} from "@/lib/compare-pages";
import { pageMetadata } from "@/lib/page-seo";
import { routes } from "@/lib/routes";

export function generateStaticParams() {
  return COMPARE_PAGES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const page = getComparePage(params.slug);
  if (!page) return { title: "Compare — SEOHub" };
  return pageMetadata({
    title: `${page.title} — SEOHub`,
    description: page.description,
    path: comparePath(page.slug),
  });
}

export default function CompareSlugPage({ params }: { params: { slug: string } }) {
  const page = getComparePage(params.slug);
  if (!page) notFound();

  const faqJsonLd =
    page.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;

  const related = (page.relatedCompareSlugs ?? [])
    .map((slug) => getComparePage(slug))
    .filter(Boolean);

  return (
    <main className="min-h-screen pb-16">
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}

      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.positioning}
        actions={
          <>
            <PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>
            <SecondaryCta href={routes.compare}>All comparisons</SecondaryCta>
          </>
        }
      />

      <article className="mx-auto mt-10 max-w-3xl space-y-12 px-4 text-ink-muted sm:px-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">The honest take</h2>
          <div className="mt-3 space-y-3 leading-relaxed">
            {page.summary.map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Side by side</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/15">
                  <th className="py-3 pr-4 font-semibold text-ink">Dimension</th>
                  <th className="py-3 pr-4 font-semibold text-ink">SEOHub</th>
                  <th className="py-3 font-semibold text-ink">{page.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {page.rows.map((row) => (
                  <tr key={row.dimension} className="border-b border-ink/8 align-top">
                    <td className="py-3 pr-4 font-medium text-ink">{row.dimension}</td>
                    <td className="py-3 pr-4">{row.seohub}</td>
                    <td className="py-3">{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Choose SEOHub when</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {page.chooseSeoHubWhen.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-teal">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Choose {page.competitor} when
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {page.chooseOtherWhen.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-ink-muted">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {page.faqs.length > 0 ? (
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">FAQ</h2>
            <dl className="mt-4 space-y-5">
              {page.faqs.map((item) => (
                <div key={item.q}>
                  <dt className="font-medium text-ink">{item.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="border-t border-ink/10 pt-10">
            <h2 className="font-display text-xl font-semibold text-ink">Related comparisons</h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) =>
                r ? (
                  <li key={r.slug}>
                    <Link href={comparePath(r.slug)} className="text-teal hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          </section>
        ) : null}

        <p className="border-t border-ink/10 pt-6 text-sm">
          <Link href={routes.tools} className="font-medium text-teal hover:underline">
            Browse free tools
          </Link>{" "}
          or{" "}
          <Link href={routes.home} className="font-medium text-teal hover:underline">
            run a free homepage scan
          </Link>
          .
        </p>
      </article>
    </main>
  );
}

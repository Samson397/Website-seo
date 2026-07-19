import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { ChecklistDigestCta } from "@/components/ChecklistDigestCta";
import { TechnicalSeoChecklistPdfButton } from "@/components/TechnicalSeoChecklistPdf";
import { pageMetadata } from "@/lib/page-seo";
import { routes } from "@/lib/routes";
import {
  TECHNICAL_SEO_CHECKLIST_SECTIONS,
  TECHNICAL_SEO_CHECKLIST_SUBTITLE,
  TECHNICAL_SEO_CHECKLIST_TITLE,
  checklistItemCount,
} from "@/lib/technical-seo-checklist";
import { getSiteUrl } from "@/lib/site-url";
import { APP_NAME } from "@/lib/brand";

const PATH = routes.technicalSeoChecklist;

export const metadata = pageMetadata({
  title: `${TECHNICAL_SEO_CHECKLIST_TITLE} — ${APP_NAME}`,
  description: TECHNICAL_SEO_CHECKLIST_SUBTITLE,
  path: PATH,
});

export default function TechnicalSeoChecklistPage() {
  const siteUrl = getSiteUrl();
  const count = checklistItemCount();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TECHNICAL_SEO_CHECKLIST_TITLE,
    description: TECHNICAL_SEO_CHECKLIST_SUBTITLE,
    url: `${siteUrl}${PATH}`,
    isPartOf: { "@type": "WebSite", name: APP_NAME, url: siteUrl },
  };

  return (
    <main className="min-h-screen pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Free checklist"
        title={TECHNICAL_SEO_CHECKLIST_TITLE}
        description={`${TECHNICAL_SEO_CHECKLIST_SUBTITLE} ${count} checks — print or Save as PDF anytime.`}
        actions={
          <>
            <PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>
            <TechnicalSeoChecklistPdfButton className="inline-flex rounded-xl border border-ink/15 bg-white/70 px-5 py-2.5 text-sm font-semibold text-ink backdrop-blur transition hover:border-ink/25 hover:bg-white" />
            <SecondaryCta href={routes.history}>Weekly digest</SecondaryCta>
          </>
        }
      />

      <div className="mx-auto mt-10 max-w-3xl space-y-12 px-4 sm:px-6">
        <p className="text-sm text-ink-muted">
          Work the list top-down. When you want Pass/Fail results across your site,{" "}
          <Link href={routes.home} className="font-medium text-teal hover:underline">
            run a free homepage scan
          </Link>{" "}
          and unlock a full-site crawl. Prefer a printable copy? Use{" "}
          <strong className="font-semibold text-ink">Save as PDF</strong> (opens a print-friendly
          page — choose Print → Save as PDF in your browser).
        </p>

        {TECHNICAL_SEO_CHECKLIST_SECTIONS.map((section) => (
          <section key={section.id} className="border-t border-ink/10 pt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">{section.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{section.summary}</p>
            <ul className="mt-5 space-y-3">
              {section.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 border-l-2 border-teal/40 pl-4 py-1"
                >
                  <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-ink/20 bg-white" aria-hidden />
                  <div>
                    <p className="font-medium text-ink">{item.label}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{item.hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-8">
          <TechnicalSeoChecklistPdfButton />
          <Link
            href={routes.home}
            className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/40 hover:bg-teal-soft"
          >
            Scan your site
          </Link>
        </div>

        <ChecklistDigestCta />

        <p className="border-t border-ink/10 pt-6 text-sm text-ink-muted">
          Next steps:{" "}
          <Link href={routes.guides} className="font-medium text-teal hover:underline">
            Fix guides
          </Link>
          {" · "}
          <Link
            href={`${routes.blog}/full-site-seo-audit-checklist`}
            className="font-medium text-teal hover:underline"
          >
            Full-site audit order of operations
          </Link>
          {" · "}
          <Link href={routes.tools} className="font-medium text-teal hover:underline">
            Free SEO tools
          </Link>
        </p>
      </div>
    </main>
  );
}

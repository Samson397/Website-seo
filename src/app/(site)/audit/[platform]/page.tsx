import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import {
  getPlatformAudit,
  PLATFORM_AUDITS,
  platformAuditPath,
  platformScanCtaHref,
} from "@/lib/platform-audits";
import { pageMetadata } from "@/lib/page-seo";
import { routes } from "@/lib/routes";

export function generateStaticParams() {
  return PLATFORM_AUDITS.map((p) => ({ platform: p.slug }));
}

export function generateMetadata({ params }: { params: { platform: string } }) {
  const audit = getPlatformAudit(params.platform);
  if (!audit) return { title: "Platform SEO audit — SEOHub" };
  return pageMetadata({
    title: `${audit.title} — SEOHub`,
    description: audit.description,
    path: platformAuditPath(audit.slug),
  });
}

export default function PlatformAuditPage({ params }: { params: { platform: string } }) {
  const audit = getPlatformAudit(params.platform);
  if (!audit) notFound();

  const others = PLATFORM_AUDITS.filter((p) => p.slug !== audit.slug);

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow={`${audit.shortName} SEO audit`}
        title={audit.title}
        description={audit.summary}
        actions={
          <>
            <PrimaryCta href={platformScanCtaHref(audit.slug)}>{audit.ctaLabel}</PrimaryCta>
            <SecondaryCta href={routes.tools}>All free tools</SecondaryCta>
          </>
        }
      />

      <article className="mx-auto mt-10 max-w-2xl space-y-10 px-4 text-ink-muted sm:px-6">
        <section className="space-y-4">
          {audit.intro.map((para) => (
            <p key={para.slice(0, 48)} className="leading-relaxed">
              {para}
            </p>
          ))}
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Common {audit.shortName} SEO failures
          </h2>
          <ul className="mt-5 space-y-5">
            {audit.commonFailures.map((item) => (
              <li key={item.title} className="border-t border-ink/10 pt-4">
                <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed sm:text-base">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {audit.shortName}-specific checklist
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">{audit.whyDifferent}</p>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed sm:text-base">
            {audit.checklist.map((item) => (
              <li key={item.slice(0, 40)}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="border-t border-ink/10 pt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Run a free homepage scan</h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            Paste your {audit.shortName} URL on the homepage for a free preview of titles, meta,
            canonicals, security headers, and more — then unlock a full-site crawl when you need
            every template checked.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryCta href={platformScanCtaHref(audit.slug)}>{audit.ctaLabel}</PrimaryCta>
            <SecondaryCta href={routes.guides}>Fix guides</SecondaryCta>
          </div>
        </section>

        <section className="border-t border-ink/10 pt-8">
          <h2 className="font-display text-lg font-semibold text-ink">Audits by platform</h2>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  href={platformAuditPath(p.slug)}
                  className="font-medium text-teal hover:underline"
                >
                  {p.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

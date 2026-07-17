import Link from "next/link";
import { PageHero, PrimaryCta } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";
import { GUIDES } from "@/lib/guides";

export const metadata = {
  title: "SEO fix guides — SEOScan",
  description: "Short, practical guides for the most common SEOScan check failures.",
};

export default function GuidesPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Guides"
        title="Fix what the scan finds."
        description="Plain-English steps for titles, canonicals, security headers, and more."
        actions={<PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>}
      />

      <div className="mx-auto mt-10 max-w-3xl space-y-6 px-4 sm:px-6">
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
    </main>
  );
}

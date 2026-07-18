import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { getGuide, GUIDES } from "@/lib/guides";
import { routes } from "@/lib/routes";
import { pageMeta } from "@/lib/page-meta";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide) return pageMeta({ title: "Guide — SEOHub", description: "SEOHub fix guide.", path: "/guides" });
  return pageMeta({
    title: `${guide.title} — SEOHub`,
    description: guide.summary.length >= 120 ? guide.summary : `${guide.summary} Practical steps from SEOHub’s free SEO audit toolkit.`,
    path: `/guides/${guide.slug}`,
  });
}

export default function GuideArticlePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow={guide.category}
        title={guide.title}
        description={guide.summary}
        actions={
          <>
            <PrimaryCta href={routes.home}>Scan your site</PrimaryCta>
            <SecondaryCta href={routes.guides}>All guides</SecondaryCta>
          </>
        }
      />
      <article className="mx-auto mt-10 max-w-2xl space-y-5 px-4 text-ink-muted sm:px-6">
        {guide.body.map((para) => (
          <p key={para.slice(0, 40)} className="leading-relaxed">
            {para}
          </p>
        ))}
        <p className="border-t border-ink/10 pt-6 text-sm">
          <Link href={routes.tools} className="font-medium text-teal hover:underline">
            Browse free tools
          </Link>{" "}
          or{" "}
          <Link href={routes.home} className="font-medium text-teal hover:underline">
            run a full site scan
          </Link>
          .
        </p>
      </article>
    </main>
  );
}

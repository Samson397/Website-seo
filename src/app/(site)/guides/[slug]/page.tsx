import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkedParagraph, stripMarkdownLinks } from "@/components/LinkedParagraph";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { getGuide, GUIDES } from "@/lib/guides";
import { getSiteUrl } from "@/lib/site-url";
import { routes } from "@/lib/routes";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide) return { title: "Guide — SEOHub" };
  const description =
    guide.summary.length >= 120
      ? guide.summary
      : `${guide.summary} Practical SEOHub fix guide — free to read, no account.`;
  return {
    title: `${guide.title} — SEOHub`,
    description,
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

function stepName(text: string, index: number): string {
  const plain = stripMarkdownLinks(text).replace(/\s+/g, " ").trim();
  const sentence = plain.split(/(?<=[.!?])\s+/)[0] || plain;
  if (sentence.length <= 80) return sentence;
  return `${sentence.slice(0, 77).trim()}…` || `Step ${index + 1}`;
}

export default function GuideArticlePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const siteUrl = getSiteUrl();
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: guide.summary,
    url: `${siteUrl}${routes.guides}/${guide.slug}`,
    step: guide.body.map((para, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: stepName(para, index),
      text: stripMarkdownLinks(para),
      url: `${siteUrl}${routes.guides}/${guide.slug}#step-${index + 1}`,
    })),
  };

  return (
    <main className="min-h-screen pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
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
        {guide.body.map((para, index) => (
          <div key={`${guide.slug}-${index}`} id={`step-${index + 1}`}>
            <LinkedParagraph text={para} className="leading-relaxed" />
          </div>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkedParagraph } from "@/components/LinkedParagraph";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { BLOG_POSTS, formatBlogDate } from "@/lib/blog";
import { getBlogPostBySlug, listAllBlogPosts } from "@/lib/blog-db";
import {
  formatSpotlightScoreLine,
  getSpotlightBySlug,
} from "@/lib/blog-spotlights";
import { getSiteUrl } from "@/lib/site-url";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  if (post) {
    const description =
      post.summary.length >= 120
        ? post.summary
        : `${post.summary} SEOHub blog — free to read, no account.`;
    return {
      title: `${post.title} — SEOHub`,
      description,
      alternates: { canonical: `${routes.blog}/${post.slug}` },
      openGraph: {
        title: post.title,
        description,
        type: "article",
        publishedTime: post.publishedAt,
        url: `${routes.blog}/${post.slug}`,
      },
    };
  }

  const spotlight = await getSpotlightBySlug(params.slug);
  if (!spotlight) return { title: "Blog — SEOHub" };
  return {
    title: `${spotlight.title} — SEOHub`,
    description: spotlight.excerpt,
    alternates: { canonical: `${routes.blog}/${spotlight.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  if (post) {
    const siteUrl = getSiteUrl();
    const related = (await listAllBlogPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.summary,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { "@type": "Organization", name: "SEOHub", url: siteUrl },
      publisher: { "@type": "Organization", name: "SEOHub", url: siteUrl },
      mainEntityOfPage: `${siteUrl}${routes.blog}/${post.slug}`,
    };

    return (
      <main className="min-h-screen pb-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PageHero
          eyebrow={post.category}
          title={post.title}
          description={post.summary}
          actions={
            <>
              <PrimaryCta href={routes.home}>Scan your site</PrimaryCta>
              <SecondaryCta href={routes.blog}>All posts</SecondaryCta>
            </>
          }
        />
        <article className="mx-auto mt-10 max-w-2xl space-y-5 px-4 text-ink-muted sm:px-6">
          <time dateTime={post.publishedAt} className="block text-xs text-ink-muted/80">
            {formatBlogDate(post.publishedAt)}
          </time>
          {post.body.map((para, index) => (
            <LinkedParagraph
              key={`${post.slug}-${index}`}
              text={para}
              className="leading-relaxed"
            />
          ))}
          <p className="border-t border-ink/10 pt-6 text-sm">
            <Link href={routes.home} className="font-medium text-teal hover:underline">
              Run a free homepage scan
            </Link>
            {" · "}
            <Link
              href={routes.technicalSeoChecklist}
              className="font-medium text-teal hover:underline"
            >
              Technical SEO Checklist
            </Link>
            {" · "}
            <Link href={routes.guides} className="font-medium text-teal hover:underline">
              Fix guides
            </Link>
            {" · "}
            <Link href={routes.tools} className="font-medium text-teal hover:underline">
              Free tools
            </Link>
          </p>
          {related.length > 0 ? (
            <aside className="border-t border-ink/10 pt-8">
              <h2 className="font-display text-lg font-semibold text-ink">More from the blog</h2>
              <ul className="mt-4 space-y-3">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`${routes.blog}/${p.slug}`}
                      className="text-sm font-medium text-teal hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </article>
      </main>
    );
  }

  const spotlight = await getSpotlightBySlug(params.slug);
  if (!spotlight) notFound();

  const scannedLabel = new Date(spotlight.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Site spotlight"
        title={spotlight.title}
        description={spotlight.excerpt}
        actions={
          <>
            <PrimaryCta href={routes.home}>Scan your site</PrimaryCta>
            <SecondaryCta href={routes.blog}>All posts</SecondaryCta>
          </>
        }
      />
      <article className="mx-auto mt-10 max-w-2xl space-y-6 px-4 text-ink-muted sm:px-6">
        <p className="leading-relaxed">
          SEOHub ran a full-site audit on{" "}
          <a
            href={spotlight.url}
            className="font-medium text-teal hover:underline"
            rel="noopener noreferrer"
          >
            {spotlight.hostname}
          </a>{" "}
          on {scannedLabel}.
        </p>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Score snapshot</h2>
          <p className="mt-2 leading-relaxed">{formatSpotlightScoreLine(spotlight.scores)}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">What stood out</h2>
          {spotlight.body.themes.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              {spotlight.body.themes.map((theme) => (
                <li key={theme}>{theme}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 leading-relaxed">
              No major checklist themes highlighted in this snapshot.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Visit the site</h2>
          <p className="mt-2">
            <a
              href={spotlight.url}
              className="font-medium text-teal hover:underline"
              rel="noopener noreferrer"
            >
              {spotlight.hostname}
            </a>
          </p>
        </section>

        <p className="border-t border-ink/10 pt-6 text-sm">
          Want the same checkup?{" "}
          <Link href={routes.home} className="font-medium text-teal hover:underline">
            Run a free SEO audit
          </Link>
          .
        </p>
      </article>
    </main>
  );
}

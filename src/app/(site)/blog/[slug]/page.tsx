import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import {
  BLOG_POSTS,
  formatBlogDate,
  getBlogPost,
  listBlogPosts,
} from "@/lib/blog";
import { getSiteUrl } from "@/lib/site-url";
import { routes } from "@/lib/routes";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) return { title: "Blog — SEOHub" };
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

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const related = listBlogPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "SEOHub",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "SEOHub",
      url: siteUrl,
    },
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
        {post.body.map((para) => (
          <p key={para.slice(0, 48)} className="leading-relaxed">
            {para}
          </p>
        ))}
        <p className="border-t border-ink/10 pt-6 text-sm">
          <Link href={routes.home} className="font-medium text-teal hover:underline">
            Run a free homepage scan
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

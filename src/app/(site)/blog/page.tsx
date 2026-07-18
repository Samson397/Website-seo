import Link from "next/link";
import { PageHero, PrimaryCta } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/page-seo";
import { formatBlogDate } from "@/lib/blog";
import { listAllBlogPosts } from "@/lib/blog-db";
import { listSpotlights } from "@/lib/blog-spotlights";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "SEO blog — SEOHub",
  description:
    "Practical SEO articles and opted-in site spotlights from full-site audits — written to help your site rank, not to sell a subscription.",
  path: routes.blog,
});

export default async function BlogIndexPage() {
  const [posts, spotlights] = await Promise.all([
    listAllBlogPosts(),
    listSpotlights(1),
  ]);

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Blog"
        title="SEO notes that ship."
        description="Full-site audits, AI visibility, and fix workflows — plus opted-in site spotlights from paid scans."
        actions={<PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>}
      />

      <div className="mx-auto mt-10 max-w-3xl space-y-6 px-4 sm:px-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`${routes.blog}/${post.slug}`}
            className="block border-t border-ink/10 pt-5 transition hover:border-teal"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                {post.category}
              </p>
              <time dateTime={post.publishedAt} className="text-xs text-ink-muted">
                {formatBlogDate(post.publishedAt)}
              </time>
            </div>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink">{post.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{post.summary}</p>
          </Link>
        ))}

        <section className="border-t border-ink/10 pt-10">
          <h2 className="font-display text-xl font-semibold text-ink">Site spotlights</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Public snapshots from customers who opted in at checkout — scores and a homepage link.
          </p>
          {spotlights.posts.length === 0 ? (
            <p className="mt-5 text-sm text-ink-muted">
              No spotlights yet. Unlock a full-site scan and opt in to feature your site here.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              {spotlights.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`${routes.blog}/${post.slug}`}
                  className="block border-t border-ink/10 pt-5 transition hover:border-teal"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold text-ink">{post.hostname}</h3>
                    <time dateTime={post.createdAt} className="text-xs text-ink-muted">
                      {formatBlogDate(post.createdAt.slice(0, 10))}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

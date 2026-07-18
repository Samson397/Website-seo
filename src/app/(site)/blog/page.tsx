import Link from "next/link";
import { PageHero, PrimaryCta } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/page-seo";
import { formatBlogDate, listBlogPosts } from "@/lib/blog";
import { routes } from "@/lib/routes";

export const metadata = pageMetadata({
  title: "SEO blog — SEOHub",
  description:
    "Practical SEO articles on full-site audits, AI visibility, and fixing crawl issues — written to help your site rank, not to sell a subscription.",
  path: routes.blog,
});

export default function BlogIndexPage() {
  const posts = listBlogPosts();

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Blog"
        title="SEO notes that ship."
        description="Full-site audits, AI visibility, and fix workflows — short posts you can act on after a scan."
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
              <time
                dateTime={post.publishedAt}
                className="text-xs text-ink-muted"
              >
                {formatBlogDate(post.publishedAt)}
              </time>
            </div>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink">{post.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{post.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

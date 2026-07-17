import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SEOScan",
  description: "Privacy policy for SEOScan.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl text-ink-muted">
        <Link href="/" className="text-sm text-teal hover:underline">
          ← Back to SEOScan
        </Link>
        <h1 className="font-display mt-6 text-3xl font-semibold text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: July 2026</p>

        <h2 className="font-display mt-8 text-xl font-semibold text-ink">What we collect</h2>
        <p className="mt-2 leading-relaxed">
          When you scan a URL, we fetch that <strong className="font-medium text-ink">public</strong>{" "}
          website (HTML, robots.txt, sitemap, DNS/SSL where available) and analyze it.
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">
          Anonymized scan insights
        </h2>
        <p className="mt-2 leading-relaxed">
          We may store aggregated, anonymized facts about public websites that are scanned — for
          example hostname, TLD, category scores, and issue counts. We use this to power live
          benchmarks on SEOScan and may license or sell <em>aggregated market insights</em> derived
          from public-website scans (similar to industry SEO datasets). This is not personal
          profile data.
        </p>
        <p className="mt-2 leading-relaxed">
          We do <strong className="font-medium text-ink">not</strong> sell your name, email, or
          browsing identity as a personal data product.
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Email (optional)</h2>
        <p className="mt-2 leading-relaxed">
          If you submit your email, we only store it when you tick the consent box. We use it to
          send the follow-up you asked for. Marketing tips are sent only if you also opt in. You
          can ask us to delete your email via the About page contact path. We do not sell email
          addresses.
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">
          On-device history &amp; watchlist
        </h2>
        <p className="mt-2 leading-relaxed">
          Recent scans and your watchlist are saved in your browser&apos;s local storage so you can
          re-check sites without creating an account. Clearing site data removes them.
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Advertising</h2>
        <p className="mt-2 leading-relaxed">
          We may show small third-party ads (for example Google AdSense). Ad partners may use
          cookies or similar technologies as described in their policies. You can control cookies
          via our consent banner and your browser settings.
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Analytics</h2>
        <p className="mt-2 leading-relaxed">
          We use Vercel Web Analytics to understand traffic (page views, performance).
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Third-party services</h2>
        <p className="mt-2 leading-relaxed">
          Optional integrations (Google PageSpeed, DataForSEO, AdSense) may receive the URL or page
          context you submit when those features are enabled.
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Accounts</h2>
        <p className="mt-2 leading-relaxed">
          SEOScan does not require an account. There is no password login or user profile database.
        </p>

        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Contact</h2>
        <p className="mt-2 leading-relaxed">
          Questions or deletion requests? See our <Link href="/about">About</Link> page.
        </p>
      </article>
    </main>
  );
}

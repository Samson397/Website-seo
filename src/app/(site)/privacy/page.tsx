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
          When you enter a URL to audit, we fetch that public webpage (and related public files
          such as robots.txt and sitemap.xml) and analyze them. Scan results are returned to your
          browser and are not stored on our servers after the response is sent.
        </p>
        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Accounts</h2>
        <p className="mt-2 leading-relaxed">
          SEOScan does not require an account. There is no login, saved site list, or user profile
          database.
        </p>
        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Analytics</h2>
        <p className="mt-2 leading-relaxed">
          We use Vercel Web Analytics to understand traffic (page views, performance). This may
          use cookies or similar technologies as described in Vercel&apos;s privacy documentation.
        </p>
        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Third-party services</h2>
        <p className="mt-2 leading-relaxed">
          Optional integrations (Google PageSpeed, DataForSEO) may receive the URL you submit
          when those features are enabled by the site operator.
        </p>
        <h2 className="font-display mt-6 text-xl font-semibold text-ink">Contact</h2>
        <p className="mt-2 leading-relaxed">
          Questions? See our <Link href="/about">About</Link> page.
        </p>
      </article>
    </main>
  );
}

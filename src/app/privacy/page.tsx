import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SEOScan",
  description: "Privacy policy for SEOScan.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-2xl text-slate-700">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to auditor
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: July 2026</p>
        <h2 className="mt-8 text-xl font-semibold text-slate-900">What we collect</h2>
        <p className="mt-2 leading-relaxed">
          When you enter a URL to audit, we fetch that public webpage and analyze it. One-off scans
          without an account are not stored on our servers after the response is sent.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Accounts &amp; monitoring</h2>
        <p className="mt-2 leading-relaxed">
          If you create a free account, we store your email, saved site URLs, and scan results so
          you can view history in your dashboard. You can delete sites from your
          dashboard at any time.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Analytics</h2>
        <p className="mt-2 leading-relaxed">
          We use Vercel Web Analytics to understand traffic (page views, performance). This may
          use cookies or similar technologies as described in Vercel&apos;s privacy documentation.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Third-party services</h2>
        <p className="mt-2 leading-relaxed">
          Optional integrations (Google PageSpeed, DataForSEO) may receive the URL you submit
          when those features are enabled by the site operator.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Contact</h2>
        <p className="mt-2 leading-relaxed">
          Questions? See our <Link href="/about">About</Link> page for contact information.
        </p>
      </article>
    </main>
  );
}

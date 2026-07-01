import Link from "next/link";

export const metadata = {
  title: "Terms of Service — SEOScan",
  description: "Terms of service for SEOScan.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-2xl text-slate-700">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to SEOScan
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: July 2026</p>
        <h2 className="mt-8 text-xl font-semibold text-slate-900">Using SEOScan</h2>
        <p className="mt-2 leading-relaxed">
          SEOScan is a free tool for scanning public websites. You may only audit URLs you own or
          have permission to test. Do not use this service to attack, overload, or scrape sites
          without authorization.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">No warranty</h2>
        <p className="mt-2 leading-relaxed">
          Results are provided for informational purposes only. We do not guarantee accuracy,
          completeness, or that fixing reported issues will improve search rankings or security.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Availability</h2>
        <p className="mt-2 leading-relaxed">
          The service is offered as-is. We may change, limit, or discontinue features at any time
          without notice.
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Contact</h2>
        <p className="mt-2 leading-relaxed">
          Questions? See our <Link href="/about">About</Link> page or open an issue on{" "}
          <a
            href="https://github.com/Samson397/Website-seo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            GitHub
          </a>
          .
        </p>
      </article>
    </main>
  );
}

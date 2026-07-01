import Link from "next/link";

export const metadata = {
  title: "About — Website SEO Auditor",
  description: "About the free Website SEO Auditor tool.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-2xl text-slate-700">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to auditor
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">About Website SEO Auditor</h1>
        <p className="mt-4 leading-relaxed">
          Website SEO Auditor is a free online tool that scans any public website and tells you
          what you have and what&apos;s missing — SEO tags, performance, security headers,
          accessibility, DNS records, and more.
        </p>
        <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
        <p className="mt-2 leading-relaxed">
          This project is open source. Report issues or contribute on{" "}
          <a
            href="https://github.com/Samson397/Website-seo"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">How it works</h2>
        <p className="mt-2 leading-relaxed">
          Paste a URL, click Analyze, and we fetch the page HTML plus robots.txt, sitemap, DNS,
          and SSL data. Results appear in plain English with copy-paste fix snippets.
        </p>
      </article>
    </main>
  );
}

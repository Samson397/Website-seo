import Link from "next/link";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "About — SEOScan",
  description: "About the free SEOScan full-site audit tool.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl text-ink-muted">
        <Link href={routes.home} className="text-sm text-teal hover:underline">
          ← Full site scan
        </Link>
        <h1 className="font-display mt-6 text-3xl font-semibold text-ink">About SEOScan</h1>
        <p className="mt-4 leading-relaxed">
          SEOScan is a free tool that crawls a public website and runs 50+ checks for SEO,
          performance, security, accessibility, and trust signals. No account required.
        </p>
        <h2 className="font-display mt-8 text-xl font-semibold text-ink">How it works</h2>
        <p className="mt-2 leading-relaxed">
          Paste a URL and we discover pages from your sitemap and internal links, then check
          each one for titles, descriptions, and headings. The homepage also gets a deep audit
          of technical SEO, security headers, DNS, and more — with plain-English fixes.
        </p>
        <h2 className="font-display mt-8 text-xl font-semibold text-ink">Also free</h2>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href={routes.competitors} className="text-teal hover:underline">
              Competitor compare
            </Link>
          </li>
          <li>
            <Link href={routes.metaPreview} className="text-teal hover:underline">
              Meta &amp; SERP preview
            </Link>
          </li>
          <li>
            <Link href={routes.robotsInspector} className="text-teal hover:underline">
              robots.txt &amp; sitemap inspector
            </Link>
          </li>
          <li>
            <Link href={routes.headers} className="text-teal hover:underline">
              Security headers checker
            </Link>
          </li>
        </ul>
      </article>
    </main>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { HomeFeatures } from "@/components/HomeFeatures";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { routes } from "@/lib/routes";
import HomeScanClient from "./HomeScanClient";

export const metadata = pageMetadata({
  title: "Full-site SEO. No subscription. | SEOHub",
  description:
    "Run a free homepage SEO audit with scores out of 10 for SEO, speed, accessibility, security, and AI visibility. Unlock one full-site crawl of up to 200 pages with fixes, checklist, and exports — no account required.",
  path: "/",
});

function HomeShell() {
  return (
    <main className="min-h-screen pb-16">
      <section className="hero-mesh relative overflow-hidden px-4 pb-14 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8">
        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            SEOHub
          </p>
          <h1 className="font-display mt-4 max-w-xl text-xl font-semibold tracking-tight text-ink-soft sm:text-2xl">
            Full-site SEO. No subscription.
          </h1>
          <p className="mt-3 max-w-lg text-base text-ink-muted sm:text-lg">
            Free homepage scores and AI visibility. Unlock a full crawl with fixes when you need
            the complete report.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HomeShell />}>
        <HomeScanClient />
      </Suspense>

      {/* Always in the HTML document for crawlers (outside useSearchParams Suspense). */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SeoPageIntro heading="What SEOHub checks on every scan">
          <p>
            SEOHub is a full-site SEO audit tool for founders and marketers. Paste any public URL
            to crawl on-page SEO, technical signals, accessibility, security headers, Core Web
            Vitals (when PageSpeed is configured), and AI visibility readiness — including bots,
            llms.txt, and entity schema cues that large language models look for.
          </p>
          <p>
            The free preview scores your homepage out of 10 across SEO, speed, accessibility,
            security, and AI. A single paid unlock expands the same report into a site-wide crawl
            of up to 200 pages with duplicate titles, thin content, canonical issues, a Pass /
            Fail / Review checklist, exportable CSV, JSON, and PDF, plus a shareable report link.
          </p>
          <p>
            No account is required. History and watchlists stay on your device. Pair the audit with
            free tools for{" "}
            <Link href={routes.keywords} className="font-medium text-teal hover:underline">
              keyword research
            </Link>
            ,{" "}
            <Link href={routes.metaPreview} className="font-medium text-teal hover:underline">
              meta previews
            </Link>
            , redirects, schema, and generators — or{" "}
            <Link href={routes.sampleReport} className="font-medium text-teal hover:underline">
              open the sample report
            </Link>{" "}
            to see the full deliverable before you scan.
          </p>
        </SeoPageIntro>
        <HomeFeatures />
      </div>
    </>
  );
}

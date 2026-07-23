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

export default function HomePage() {
  return (
    <>
      {/*
        HomeScanClient SSRs the hero. useSearchParams lives in an inner Suspense
        so the hero is not swapped out of the document (keeps LCP on brand/copy).
      */}
      <HomeScanClient />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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

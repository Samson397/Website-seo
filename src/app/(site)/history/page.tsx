import type { Metadata } from "next";
import HistoryPageClient from "./HistoryPageClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Scan history & watchlist — SEOHub",
    description:
      "Review past SEOHub audits and manage an on-device watchlist of sites to re-scan. History stays in your browser — free, no account required.",
    path: "/history",
  }),
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return (
    <>
      <HistoryPageClient />
      <SeoPageIntro heading="Keep weekly SEO checks on this device">
        <p>
          SEOHub stores recent scans and watchlist URLs in your browser so you can compare scores
          over time without creating an account. Add important domains to the watchlist, re-run
          audits when they are due, and optionally subscribe to email digests for watchlist reminders.
        </p>
        <p>
          For a deeper pass, unlock a full-site crawl from any free homepage preview to see
          duplicate titles, thin pages, canonical issues, and a complete checklist across up to
          200 URLs.
        </p>
      </SeoPageIntro>
    </>
  );
}

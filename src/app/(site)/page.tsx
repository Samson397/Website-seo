import type { Metadata } from "next";
import { pageMeta } from "@/lib/page-meta";
import { HOME_SEO } from "@/lib/page-seo";
import { HomePageClient } from "./HomePageClient";

export const metadata: Metadata = pageMeta(HOME_SEO);

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does a SEOHub full-site audit include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SEOHub crawls public HTML across your site (up to 200 pages), runs 50+ checks covering SEO, performance signals, accessibility, security headers, and AI visibility, then groups issues by URL template.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an account to run an SEO audit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Paste a URL and start. History and watchlists stay on this device. A free homepage preview unlocks scores first; a one-time unlock reveals the full crawl, checklist, and exports when payments are enabled.",
      },
    },
    {
      "@type": "Question",
      name: "How is SEOHub different from enterprise SEO platforms?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SEOHub is built for a weekly site check without SaaS lock-in: clear scores out of 10, practical fix snippets, free keyword and technical tools, and optional one-time unlock.",
      },
    },
    {
      "@type": "Question",
      name: "Can JavaScript-heavy sites be audited?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SEOHub fetches public HTML only (no headless browser). JS-rendered apps may show fewer on-page signals. Static and server-rendered sites get the richest crawl coverage.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <HomePageClient />
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AdSenseLoader } from "@/components/AdSenseLoader";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { VisitorTracker } from "@/components/VisitorTracker";
import { IBM_Plex_Sans, Syne } from "next/font/google";
import "./globals.css";

import { ADSENSE_CLIENT } from "@/lib/adsense";
import { OG_IMAGE } from "@/lib/page-seo";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";
import { getSiteUrl } from "@/lib/site-url";

// optional + fixed weights: avoid mobile CLS from late font swaps (PSI CLS ~0.42).
const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "optional",
  weight: ["600", "700", "800"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "optional",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = getSiteUrl();

const title = "Full-site SEO. No subscription. | SEOHub";
const description =
  "Free homepage SEO scores out of 10, then unlock a full-site crawl of up to 200 pages with fixes and exports. No account required.";

/** Paid unlock amount for schema (mirror Stripe display without currency symbol). */
const paidPriceAmount = FULL_SCAN_PRICE_LABEL.replace(/^\$/, "") || "4.99";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: `${siteUrl}/` },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/`,
    siteName: "SEOHub",
    type: "website",
    locale: "en_GB",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=7", sizes: "any" },
      { url: "/favicon-32.png?v=7", sizes: "32x32", type: "image/png" },
      { url: "/logo-icon.png?v=7", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=7", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: true, follow: true },
  // AdSense site verification — exact tag from AdSense dashboard
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single root object with @graph — Safari throws on a bare JSON-LD array
  // (TypeError: r["@context"].toLowerCase).
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "SEOHub",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description,
      },
      {
        "@type": "WebSite",
        name: "SEOHub",
        url: siteUrl,
        description,
        publisher: { "@type": "Organization", name: "SEOHub", url: siteUrl },
      },
      {
        "@type": "WebApplication",
        name: "SEOHub",
        description,
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "0",
          highPrice: paidPriceAmount,
          priceCurrency: "USD",
          offerCount: 2,
          offers: [
            {
              "@type": "Offer",
              name: "Free homepage SEO preview",
              price: "0",
              priceCurrency: "USD",
              description:
                "Homepage scores out of 10 for SEO, speed, accessibility, security, and AI visibility.",
            },
            {
              "@type": "Offer",
              name: "Full-site SEO unlock",
              price: paidPriceAmount,
              priceCurrency: "USD",
              description:
                "One full-site crawl of up to 200 pages with checklist, fixes, and exports. Pay per scan — no subscription.",
            },
          ],
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* Exact AdSense verification meta (also emitted via metadata.other) */}
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <CookieConsent />
        <Suspense fallback={null}>
          <VisitorTracker />
        </Suspense>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <Analytics />
        {/* Meta tag above verifies AdSense; script loads after load + idle (see AdSenseLoader). */}
        <AdSenseLoader />
      </body>
    </html>
  );
}

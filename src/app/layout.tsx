import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { VisitorTracker } from "@/components/VisitorTracker";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

import { OG_IMAGE } from "@/lib/page-seo";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";
import { getSiteUrl } from "@/lib/site-url";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = getSiteUrl();

const title = "Full-site SEO. No subscription. | SEOHub";
const description =
  "Run a free homepage SEO audit with scores out of 10, then unlock a full-site crawl of up to 200 pages with fixes, checklist, and exports. No account required.";

/** Paid unlock amount for schema (mirror Stripe display without currency symbol). */
const paidPriceAmount = FULL_SCAN_PRICE_LABEL.replace(/^\$/, "") || "4.99";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
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
      { url: "/favicon.ico?v=6", sizes: "any" },
      { url: "/favicon-32.png?v=6", sizes: "32x32", type: "image/png" },
      { url: "/logo-icon.png?v=6", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=6", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: true, follow: true },
  // AdSense site verification — exact tag from AdSense dashboard
  other: {
    "google-adsense-account": "ca-pub-4587075434685102",
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
        <meta name="google-adsense-account" content="ca-pub-4587075434685102" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense — Auto ads (site-wide) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4587075434685102"
          crossOrigin="anonymous"
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
      </body>
    </html>
  );
}

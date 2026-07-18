import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsent } from "@/components/CookieConsent";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

import { ADSENSE_SCRIPT_SRC } from "@/lib/adsense";
import { getSiteUrl } from "@/lib/site-url";
import { HOME_SEO } from "@/lib/page-seo";

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
const title = HOME_SEO.title;
const description = HOME_SEO.description;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s",
  },
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "SEOHub",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "SEOHub",
        url: siteUrl,
        logo: `${siteUrl}/logo-mark.svg`,
        description,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "SEOHub",
        url: siteUrl,
        description,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-GB",
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: "SEOHub",
        description,
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
        publisher: { "@id": `${siteUrl}/#organization` },
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
        {/* Raw head script so AdSense crawlers see it in initial HTML */}
        <script async src={ADSENSE_SCRIPT_SRC} crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}

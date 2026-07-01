import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const title = "SEOScan — Free Website SEO & Security Audit";
const description =
  "Paste any URL. SEOScan shows what your site has and what's missing — SEO, speed, security, accessibility, and DNS. Free, no login.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "SEOScan",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SEOScan",
    description,
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsent } from "@/components/CookieConsent";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

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

const title = "SEOScan — Free full-site SEO & security audit";
const description =
  "Paste any URL. SEOScan crawls your pages and runs 50+ SEO, speed, security, and accessibility checks. Free, no login.";

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
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}

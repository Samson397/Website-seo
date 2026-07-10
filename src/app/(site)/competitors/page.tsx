import type { Metadata } from "next";
import CompetitorsPageClient from "./CompetitorsPageClient";

export const metadata: Metadata = {
  title: "Competitor Audit — Compare Websites Side by Side | SEOScan",
  description:
    "Audit up to 10 competitor websites and compare SEO, performance, accessibility, and security scores in one ranked table. Free, no login.",
  alternates: { canonical: "/competitors" },
};

export default function CompetitorsPage() {
  return <CompetitorsPageClient />;
}

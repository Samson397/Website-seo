import type { Metadata } from "next";
import { pageMeta } from "@/lib/page-meta";
import CompetitorsPageClient from "./CompetitorsPageClient";

export const metadata: Metadata = pageMeta({
  title: "Competitor Audit — Compare Websites Side by Side | SEOHub",
  description:
    "Audit up to 10 competitor websites and compare SEO, performance, accessibility, and security scores in one ranked table. Free, no login.",
  path: "/competitors",
});

export default function CompetitorsPage() {
  return <CompetitorsPageClient />;
}

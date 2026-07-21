import { pageMetadata } from "@/lib/page-seo";
import BacklinksToolClient from "./BacklinksToolClient";

export const metadata = pageMetadata({
  title: "Backlink intelligence — SEOHub",
  description:
    "Find competitor backlink opportunities and review potentially toxic links. DataForSEO-powered outreach list for SEOHub.",
  path: "/tools/backlinks",
});

export default function BacklinksToolPage() {
  return <BacklinksToolClient />;
}

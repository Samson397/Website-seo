import { pageMetadata } from "@/lib/page-seo";
import ArticleWriterClient from "./ArticleWriterClient";

export const metadata = pageMetadata({
  title: "AI article writer — SEOHub",
  description:
    "Generate SEO titles, outlines, articles, FAQs, schema, and internal link ideas from a target keyword. Free AI content studio tool.",
  path: "/tools/article",
});

export default function ArticleWriterPage() {
  return <ArticleWriterClient />;
}

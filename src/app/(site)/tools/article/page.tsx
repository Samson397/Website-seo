import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import ArticleWriterClient from "./ArticleWriterClient";

const copy = TOOL_SEO_COPY.article;

export const metadata = pageMetadata({
  title: "AI article writer — SEOHub",
  description:
    "Generate SEO titles, outlines, articles, FAQs, schema, and internal link ideas from a target keyword. Free AI content studio tool.",
  path: "/tools/article",
});

export default function ArticleWriterPage() {
  return (
    <>
      <ArticleWriterClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

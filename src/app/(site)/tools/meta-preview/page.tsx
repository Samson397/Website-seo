import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { TOOL_SEO_COPY, ToolSeoBody } from "@/lib/tool-seo-copy";
import MetaPreviewToolClient from "./MetaPreviewToolClient";

const copy = TOOL_SEO_COPY["meta-preview"];

export const metadata = pageMetadata({
  title: "Meta & SERP preview — SEOHub",
  description:
    "Preview how your title and meta description may appear in Google search results. Edit live, check character counts, and ship clearer snippets — free, nothing stored.",
  path: "/tools/meta-preview",
});

export default function Page() {
  return (
    <>
      <MetaPreviewToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

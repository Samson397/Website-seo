import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import JsRenderToolClient from "./JsRenderToolClient";

const copy = TOOL_SEO_COPY["js-render"];

export const metadata = pageMetadata({
  title: "JavaScript rendering check — SEOHub",
  description:
    "Compare static HTML with a JS-rendered snapshot to see what client-side frameworks hide from crawlers.",
  path: "/tools/js-render",
});

export default function JsRenderToolPage() {
  return (
    <>
      <JsRenderToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

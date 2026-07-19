import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import SitemapGeneratorToolClient from "./SitemapGeneratorToolClient";

const copy = TOOL_SEO_COPY["sitemap-generator"];

export const metadata = pageMetadata({
  title: "Sitemap generator — SEOHub",
  description:
    "Build a downloadable sitemap.xml from a list of URLs. Free generator for small sites and staging launches — review before you publish.",
  path: "/tools/sitemap-generator",
});

export default function Page() {
  return (
    <>
      <SitemapGeneratorToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

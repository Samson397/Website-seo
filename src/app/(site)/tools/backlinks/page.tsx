import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import BacklinksToolClient from "./BacklinksToolClient";

const copy = TOOL_SEO_COPY.backlinks;

export const metadata = pageMetadata({
  title: "Backlink intelligence — SEOHub",
  description:
    "Find competitor backlink opportunities and review potentially toxic links. DataForSEO-powered outreach list for SEOHub.",
  path: "/tools/backlinks",
});

export default function BacklinksToolPage() {
  return (
    <>
      <BacklinksToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

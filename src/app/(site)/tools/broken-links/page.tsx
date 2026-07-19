import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { TOOL_SEO_COPY, ToolSeoBody } from "@/lib/tool-seo-copy";
import BrokenLinksToolClient from "./BrokenLinksToolClient";

const copy = TOOL_SEO_COPY["broken-links"];

export const metadata = pageMetadata({
  title: "Broken link checker — SEOHub",
  description:
    "Probe outbound links on a page for 4xx and 5xx failures. Fix dead links that hurt UX and crawl trust — free checker, no signup.",
  path: "/tools/broken-links",
});

export default function Page() {
  return (
    <>
      <BrokenLinksToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

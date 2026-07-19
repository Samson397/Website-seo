import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import RedirectsToolClient from "./RedirectsToolClient";

const copy = TOOL_SEO_COPY["redirects"];

export const metadata = pageMetadata({
  title: "Redirect chain checker — SEOHub",
  description:
    "Follow HTTP redirects hop by hop to the final URL. Find loops, long chains, and mixed http/https paths that waste crawl budget.",
  path: "/tools/redirects",
});

export default function Page() {
  return (
    <>
      <RedirectsToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

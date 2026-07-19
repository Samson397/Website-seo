import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { TOOL_SEO_COPY, ToolSeoBody } from "@/lib/tool-seo-copy";
import ContentToolClient from "./ContentToolClient";

const copy = TOOL_SEO_COPY["content"];

export const metadata = pageMetadata({
  title: "Content optimizer — SEOHub",
  description:
    "Score page copy against a target keyword with clear density, length, and structure tips. Free on-page content checks — no account needed.",
  path: "/tools/content",
});

export default function Page() {
  return (
    <>
      <ContentToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

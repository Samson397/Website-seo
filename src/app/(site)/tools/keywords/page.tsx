import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import KeywordsToolClient from "./KeywordsToolClient";

const copy = TOOL_SEO_COPY["keywords"];

export const metadata = pageMetadata({
  title: "Keyword research tool — SEOHub",
  description:
    "Extract on-page phrases and Google autocomplete suggestions from any URL. Free keyword research without an account — no login required.",
  path: "/tools/keywords",
});

export default function Page() {
  return (
    <>
      <KeywordsToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

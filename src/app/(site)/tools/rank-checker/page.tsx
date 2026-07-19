import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import RankCheckerToolClient from "./RankCheckerToolClient";

const copy = TOOL_SEO_COPY["rank-checker"];

export const metadata = pageMetadata({
  title: "Rank checker — SEOHub",
  description:
    "Score on-page keyword usage and optionally check Google positions when DataForSEO is configured. Free to start, no login required.",
  path: "/tools/rank-checker",
});

export default function Page() {
  return (
    <>
      <RankCheckerToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { TOOL_SEO_COPY, ToolSeoBody } from "@/lib/tool-seo-copy";
import RobotsGeneratorToolClient from "./RobotsGeneratorToolClient";

const copy = TOOL_SEO_COPY["robots-generator"];

export const metadata = pageMetadata({
  title: "robots.txt generator — SEOHub",
  description:
    "Create a starter robots.txt with sitemap and disallow rules. Free generator — always review the output before you publish it live.",
  path: "/tools/robots-generator",
});

export default function Page() {
  return (
    <>
      <RobotsGeneratorToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

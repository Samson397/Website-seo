import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import RobotsToolClient from "./RobotsToolClient";

const copy = TOOL_SEO_COPY["robots"];

export const metadata = pageMetadata({
  title: "robots.txt & sitemap inspector — SEOHub",
  description:
    "Fetch robots.txt rules and sitemap URL counts for any public site. Spot blocked paths and missing sitemaps before they hurt crawl coverage.",
  path: "/tools/robots",
});

export default function Page() {
  return (
    <>
      <RobotsToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

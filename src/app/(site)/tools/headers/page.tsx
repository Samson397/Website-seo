import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import HeadersToolClient from "./HeadersToolClient";

const copy = TOOL_SEO_COPY["headers"];

export const metadata = pageMetadata({
  title: "Security headers checker — SEOHub",
  description:
    "Check HSTS, CSP, X-Frame-Options, Referrer-Policy, and other HTTP security headers that protect visitors and improve trust signals.",
  path: "/tools/headers",
});

export default function Page() {
  return (
    <>
      <HeadersToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

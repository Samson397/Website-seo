import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";
import { ToolSeoBody } from "@/components/ToolSeoBody";
import { TOOL_SEO_COPY } from "@/lib/tool-seo-copy";
import SchemaToolClient from "./SchemaToolClient";

const copy = TOOL_SEO_COPY["schema"];

export const metadata = pageMetadata({
  title: "JSON-LD schema checker — SEOHub",
  description:
    "Extract and validate JSON-LD structured data from any page. Catch parse errors before Google Rich Results testing — free, no account.",
  path: "/tools/schema",
});

export default function Page() {
  return (
    <>
      <SchemaToolClient />
      <SeoPageIntro heading={copy.heading}>
        <ToolSeoBody copy={copy} />
      </SeoPageIntro>
    </>
  );
}

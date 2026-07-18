import SchemaToolClient from "./SchemaToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'JSON-LD schema checker — SEOHub',
  description: 'Extract and validate JSON-LD structured data from any page. Catch parse errors before Google Rich Results testing.',
  path: "/tools/schema",
});

export default function Page() {
  return (
    <>
      <SchemaToolClient />
      <SeoPageIntro heading='JSON-LD schema checker'>
        <p>Structured data helps search engines and AI systems understand your brand, products, and FAQs. This free tool pulls JSON-LD blocks from a page so you can confirm they parse cleanly and match the content people see.</p>
      </SeoPageIntro>
    </>
  );
}

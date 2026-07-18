import SitemapGeneratorToolClient from "./SitemapGeneratorToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Sitemap generator — SEOHub',
  description: 'Build a downloadable sitemap.xml from a list of URLs. Free generator for small sites and staging launches.',
  path: "/tools/sitemap-generator",
});

export default function Page() {
  return (
    <>
      <SitemapGeneratorToolClient />
      <SeoPageIntro heading='Sitemap generator'>
        <p>Create a starter XML sitemap you can host at /sitemap.xml. List the URLs you want crawled, download the file, and submit it in Google Search Console after you deploy.</p>
      </SeoPageIntro>
    </>
  );
}

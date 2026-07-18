import RobotsToolClient from "./RobotsToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'robots.txt & sitemap inspector — SEOHub',
  description: 'Fetch robots.txt rules and sitemap URL counts for any public site. Spot blocked paths and missing sitemaps before they hurt crawl coverage.',
  path: "/tools/robots",
});

export default function Page() {
  return (
    <>
      <RobotsToolClient />
      <SeoPageIntro heading='robots.txt & sitemap inspector'>
        <p>Inspect how search engines are allowed to crawl a site. This tool fetches robots.txt, lists sitemap references, and helps you confirm important URLs are not blocked by mistake — a common technical SEO issue on growing sites.</p>
      </SeoPageIntro>
    </>
  );
}

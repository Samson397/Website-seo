import RobotsGeneratorToolClient from "./RobotsGeneratorToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'robots.txt generator — SEOHub',
  description: 'Create a starter robots.txt with sitemap and disallow rules. Free generator — review before you publish.',
  path: "/tools/robots-generator",
});

export default function Page() {
  return (
    <>
      <RobotsGeneratorToolClient />
      <SeoPageIntro heading='robots.txt generator'>
        <p>Generate a sensible robots.txt skeleton with sitemap location and optional disallow paths. Always review the output so you do not block CSS, JS, or important landing pages.</p>
      </SeoPageIntro>
    </>
  );
}

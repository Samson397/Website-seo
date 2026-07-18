import BrokenLinksToolClient from "./BrokenLinksToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Broken link checker — SEOHub',
  description: 'Probe outbound links on a page for 4xx and 5xx failures. Fix dead links that hurt UX and crawl trust.',
  path: "/tools/broken-links",
});

export default function Page() {
  return (
    <>
      <BrokenLinksToolClient />
      <SeoPageIntro heading='Broken link checker'>
        <p>Dead links frustrate visitors and waste crawl budget. Enter a page URL to sample outbound links and flag failures so you can repair or remove them quickly.</p>
      </SeoPageIntro>
    </>
  );
}

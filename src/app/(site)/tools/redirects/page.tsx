import RedirectsToolClient from "./RedirectsToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Redirect chain checker — SEOHub',
  description: 'Follow HTTP redirects hop by hop to the final URL. Find loops, long chains, and mixed http/https paths that waste crawl budget.',
  path: "/tools/redirects",
});

export default function Page() {
  return (
    <>
      <RedirectsToolClient />
      <SeoPageIntro heading='Redirect chain checker'>
        <p>Paste a URL to see every redirect hop until the final destination. Long chains and protocol mismatches confuse crawlers and slow users — clean them to a single 301 wherever you can.</p>
      </SeoPageIntro>
    </>
  );
}

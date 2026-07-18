import KeywordsToolClient from "./KeywordsToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Keyword research tool — SEOHub',
  description: 'Extract on-page phrases and Google autocomplete suggestions from any URL. Free keyword research without an account.',
  path: "/tools/keywords",
});

export default function Page() {
  return (
    <>
      <KeywordsToolClient />
      <SeoPageIntro heading='Keyword research tool'>
        <p>Discover phrases a page already targets and related Google Suggest ideas. Pair this with a full SEOHub audit to prioritize content updates that match how people search.</p>
      </SeoPageIntro>
    </>
  );
}

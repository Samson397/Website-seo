import ContentToolClient from "./ContentToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Content optimizer — SEOHub',
  description: 'Score page copy against a target keyword with clear density, length, and structure tips. Free on-page content checks.',
  path: "/tools/content",
});

export default function Page() {
  return (
    <>
      <ContentToolClient />
      <SeoPageIntro heading='Content optimizer'>
        <p>Paste a URL and focus keyword to see whether the page has enough substance, balanced keyword use, and readable structure. Thin or off-topic pages are a top finding in SEOHub full-site crawls.</p>
      </SeoPageIntro>
    </>
  );
}

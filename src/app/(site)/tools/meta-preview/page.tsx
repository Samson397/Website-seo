import MetaPreviewToolClient from "./MetaPreviewToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Meta & SERP preview — SEOHub',
  description: 'Preview how your title and meta description may appear in Google search results. Edit live, check character counts, and ship clearer snippets — free, nothing stored.',
  path: "/tools/meta-preview",
});

export default function Page() {
  return (
    <>
      <MetaPreviewToolClient />
      <SeoPageIntro heading='Meta & SERP preview'>
        <p>Use this free tool to tune title tags and meta descriptions before you publish. Aim for about 50–60 characters in the title and 120–160 in the description so Google can show a full snippet. Changes stay in your browser; SEOHub does not save the copy you paste.</p>
      </SeoPageIntro>
    </>
  );
}

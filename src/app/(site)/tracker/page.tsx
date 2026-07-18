import TrackerPageClient from "./TrackerPageClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: "Keyword tracker — SEOHub",
  description:
    "Save target keywords on this device and re-check on-page rank signals anytime. Free keyword tracking without a login wall.",
  path: "/tracker",
});

export default function TrackerPage() {
  return (
    <>
      <TrackerPageClient />
      <SeoPageIntro heading="Track keywords without a SaaS seat">
        <p>
          Add the phrases you care about, link them to URLs you own, and revisit rank-oriented
          signals when you are ready. SEOHub keeps the list on your device so founders and
          freelancers can stay organized without another subscription.
        </p>
        <p>
          Combine the tracker with the free keyword research tool and full-site audits to prioritize
          content updates that match how people search.
        </p>
      </SeoPageIntro>
    </>
  );
}

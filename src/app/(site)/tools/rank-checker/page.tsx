import RankCheckerToolClient from "./RankCheckerToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Rank checker — SEOHub',
  description: 'Score on-page keyword usage and optionally check Google positions when DataForSEO is configured. Free to start, no login.',
  path: "/tools/rank-checker",
});

export default function Page() {
  return (
    <>
      <RankCheckerToolClient />
      <SeoPageIntro heading='Rank checker'>
        <p>Check whether a page is optimized for a target keyword and, when API keys are available, compare against live search signals. Use it alongside your watchlist to track progress over time.</p>
      </SeoPageIntro>
    </>
  );
}

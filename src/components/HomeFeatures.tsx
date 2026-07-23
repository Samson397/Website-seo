import Link from "next/link";
import { routes } from "@/lib/routes";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";

const FEATURES = [
  {
    title: "Scores out of 10",
    text: "SEO, speed, accessibility, security, and AI visibility — clear gauges, not opaque dashboards.",
  },
  {
    title: "Will AI cite you?",
    text: "GEO checks for ChatGPT, Perplexity, Claude, and Google AI: bots, llms.txt, entity schema, and brand signals.",
  },
  {
    title: "Full-site crawl + toolkit",
    text: "Up to 200 pages, crawl controls, redirects, broken links, schema, and generators — free tools stay free.",
  },
  {
    title: "Pay per full scan",
    text: `Free shows /10 scores and AI visibility. ${FULL_SCAN_PRICE_LABEL} unlocks one full-site crawl with fixes, checklist, exports, and an AI priority plan.`,
  },
];

export function HomeFeatures() {
  return (
    <section className="section-rule mt-14 space-y-10 pb-8 pt-12">
      <div className="max-w-2xl">
        <p className="font-display text-lg font-bold text-teal">Why SEOHub</p>
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          A serious SEO stack, priced like a tool.
        </h2>
        <p className="mt-3 text-ink-muted">
          Built for founders and marketers who want clear fixes without login walls.{" "}
          <Link href={routes.pricing} className="font-medium text-teal hover:underline">
            See pricing
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <article key={f.title} className="border-t border-ink/10 py-6 pr-4 sm:odd:pr-10 sm:even:pl-10">
            <h3 className="font-display text-xl font-bold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

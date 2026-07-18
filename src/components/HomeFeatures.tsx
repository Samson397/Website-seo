import Link from "next/link";
import { routes } from "@/lib/routes";

const FEATURES = [
  {
    title: "Scores out of 10",
    text: "SEO, speed, accessibility, security, and AI visibility — clear /10 gauges, not opaque dashboards.",
  },
  {
    title: "Will AI promote you?",
    text: "GEO checks for ChatGPT, Perplexity, Claude, and Google AI: bots, llms.txt, entity schema, and brand signals.",
  },
  {
    title: "Full-site crawl + toolkit",
    text: "Up to 200 pages, crawl controls, redirects, broken links, schema, and generators — free tools stay free.",
  },
  {
    title: "Pay per full scan",
    text: "Free shows /10 scores and AI visibility. $0.99 unlocks one full-site crawl with fixes, checklist, and exports.",
  },
];

export function HomeFeatures() {
  return (
    <section className="mt-14 space-y-8 pb-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Why SEOHub</p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink">
          Everything a serious SEO stack needs — priced like a tool, not a platform.
        </h2>
        <p className="mt-3 text-ink-muted">
          Built for founders and marketers who want clear fixes without login walls.{" "}
          <Link href={routes.pricing} className="font-medium text-brand hover:underline">
            See pricing
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <article key={f.title} className="border-t border-ink/10 pt-5">
            <span className="font-mono text-xs text-brand">0{i + 1}</span>
            <h3 className="font-display mt-2 text-xl font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

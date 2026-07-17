import Link from "next/link";
import { routes } from "@/lib/routes";

const FEATURES = [
  {
    title: "Technical site audit",
    text: "Crawl up to 200 pages. Titles, canonicals, schema, security headers, Core Web Vitals signals, and 50+ Pass/Fail checks.",
  },
  {
    title: "Keywords & content",
    text: "Research phrases, score on-page rank signals, optimize copy, and track keywords on this device.",
  },
  {
    title: "Toolkit that ships",
    text: "Redirects, broken links, JSON-LD, robots/sitemap inspect + generators — free forever.",
  },
  {
    title: "Pay only when you need depth",
    text: "Homepage preview is free. Unlock full-site crawl, exports, and shareable reports for a one-time fee.",
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

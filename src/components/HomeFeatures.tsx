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
    <section className="mt-20 space-y-12 pb-8">
      <div className="max-w-2xl">
        <p className="font-display text-sm font-semibold text-brand">Why SEOHub</p>
        <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          A serious SEO stack, priced like a tool.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Built for founders and marketers who want clear fixes without login walls.{" "}
          <Link href={routes.pricing} className="font-medium text-brand hover:underline">
            See pricing
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <article key={f.title}>
            <span className="font-display text-sm font-semibold text-brand/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display mt-3 text-xl font-semibold tracking-tight text-ink">
              {f.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

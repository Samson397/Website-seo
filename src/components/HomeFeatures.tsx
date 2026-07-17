const FEATURES = [
  {
    title: "Full site audit",
    text: "Crawl up to 200 pages from sitemap and internal links. 50+ checks with pass, fail, and review states.",
  },
  {
    title: "Keyword research & tracking",
    text: "Extract keyword ideas, score on-page rank signals, optimize content, and track keywords on this device.",
  },
  {
    title: "Technical SEO toolkit",
    text: "Redirects, schema, broken links, security headers, robots/sitemap inspect, plus generators.",
  },
  {
    title: "Compare, export, share",
    text: "Competitor compare, weekly watchlist reminders, CSV/JSON/PDF export, and shareable report links.",
  },
];

export function HomeFeatures() {
  return (
    <section className="mt-14 space-y-8 pb-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Why SEOHub</p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink">
          A full SEO stack — without the SaaS tax.
        </h2>
        <p className="mt-3 text-ink-muted">
          Audit, research keywords, check ranks, optimize content, and monitor sites weekly. No login
          required.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <article key={f.title} className="border-t border-ink/10 pt-5">
            <span className="font-mono text-xs text-teal">0{i + 1}</span>
            <h3 className="font-display mt-2 text-xl font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

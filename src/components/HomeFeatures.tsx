const FEATURES = [
  {
    title: "Full site crawl, every scan",
    text: "We discover pages from your sitemap and internal links, then check each one for titles, descriptions, H1s, and status codes — not just the homepage.",
  },
  {
    title: "50+ structured checks",
    text: "Results are grouped by SEO, content, technical, social, security, accessibility, trust, and performance — with clear pass, fail, and review states.",
  },
  {
    title: "Speed, security & trust",
    text: "HTTPS, SSL expiry, security headers, mixed content, response time, compression, privacy/terms links, and email DNS (SPF/DMARC/DKIM) on custom domains.",
  },
  {
    title: "Compare & export",
    text: "Line up competitor URLs side by side, re-scan to compare changes, and export CSV or print a PDF of the report when you are ready to share fixes.",
  },
];

export function HomeFeatures() {
  return (
    <section className="mt-14 space-y-8 pb-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Why SEOScan</p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink">
          One scan. The whole site.
        </h2>
        <p className="mt-3 text-ink-muted">
          Built for founders and marketers who want a clear technical picture without an account
          or a sales funnel.
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

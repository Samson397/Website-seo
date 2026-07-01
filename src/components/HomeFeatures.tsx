const FEATURES = [
  {
    title: "SEO & Google visibility",
    icon: "🔍",
    text: "We check your page title, meta description, H1 heading, canonical URL, Open Graph tags, Twitter cards, JSON-LD schema, robots.txt, XML sitemap, favicon, and internal links. Turn on full site scan to crawl up to 30 pages and catch duplicate titles or descriptions across your site.",
  },
  {
    title: "Speed & security",
    icon: "⚡",
    text: "Measure server response time, HTML weight, compression, and JavaScript load. We verify HTTPS, SSL certificate expiry, security headers, and mixed content. Optional PageSpeed integration adds Lighthouse performance and Core Web Vitals when configured on your deployment.",
  },
  {
    title: "Trust & accessibility",
    icon: "✓",
    text: "Find missing privacy or terms links, contact and about pages, form labels, image alt text, mobile viewport settings, and broken links. Every issue includes plain-English guidance and a copy-paste fix snippet where possible so you can improve quickly without guessing.",
  },
  {
    title: "Domain intelligence",
    icon: "🌐",
    text: "For custom domains we inspect DNS, domain registration expiry, SPF, DMARC, and DKIM email records. Platform hosts like vercel.app skip email DNS checks because those records cannot be set there. Export your report to CSV or PDF and re-scan after you make changes.",
  },
];

export function HomeFeatures() {
  return (
    <section className="mt-10 space-y-8 pb-24 sm:mt-16 sm:pb-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Everything we check in one scan</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          SEOScan is a free website auditor built for business owners and marketers. Paste any
          public URL — no account required — and get a clear report of what your site already
          has and what is still missing for search engines, visitors, and security. Each scan
          takes about thirty seconds and covers more than thirty-five individual checks.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
          </article>
        ))}
      </div>

      <p className="rounded-xl bg-slate-100/80 px-5 py-4 text-center text-sm text-slate-600">
        Results appear in a simple Has &amp; Missing checklist at the top, plus detailed scores
        for SEO, performance, accessibility, and security. We use analytics cookies to improve
        SEOScan — see our Privacy Policy. Scans run on demand; we do not store your audit history
        on our servers after the report is delivered.
      </p>
    </section>
  );
}

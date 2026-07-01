export function HowItWorks() {
  return (
    <section className="mt-16 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-slate-900">How it works</h2>
      <p className="mt-3 text-slate-600 leading-relaxed">
        Website SEO Auditor checks your site the same way Google and visitors experience it. We
        analyze your page title, meta description, headings, HTTPS, mobile setup, social sharing
        tags, structured data, robots.txt, sitemap, broken links, server speed, security headers,
        SSL certificate, domain DNS records, and more — then show everything in plain English.
      </p>
      <p className="mt-3 text-slate-600 leading-relaxed">
        The <strong>Has &amp; Missing</strong> panel at the top tells you at a glance what your
        site already has and what you still need to add. Each issue includes a recommendation and
        a copy-paste fix snippet where possible. Turn on <strong>Full site scan</strong> to crawl
        up to ten pages for duplicate titles and descriptions.
      </p>
      <p className="mt-3 text-slate-600 leading-relaxed">
        No account or API keys are required for the core audit. Optional PageSpeed and backlink
        data can be enabled by the site operator. Your scan runs on demand — we fetch public
        pages only and do not store audit history on our servers.
      </p>
    </section>
  );
}

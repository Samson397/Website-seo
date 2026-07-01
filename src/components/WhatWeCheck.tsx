/** Collapsible copy for SEO — content stays in the HTML when collapsed. */
export function WhatWeCheck() {
  return (
    <details className="mt-10 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">
        What does SEOScan check?
      </summary>
      <div className="mt-3 text-left text-sm leading-relaxed text-slate-600">
        <p className="mt-2">
          SEOScan is a free website auditor. Paste any public URL and we fetch the page, then
          report what you already have and what is still missing for search engines, visitors, and
          security. No account is required for a standard scan.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-medium text-slate-800">SEO &amp; visibility</h3>
            <p className="mt-1">
              Page title and meta description, H1 heading, canonical URL, Open Graph and Twitter
              cards, structured data, robots.txt, XML sitemap, favicon, and internal links. Full
              site scan crawls up to ten pages for duplicate titles and descriptions.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-800">Performance &amp; technical</h3>
            <p className="mt-1">
              Server response time, HTML size, compression, JavaScript load, HTTPS, SSL expiry, and
              optional Google PageSpeed Lighthouse scores when enabled by the site operator.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-800">Trust &amp; accessibility</h3>
            <p className="mt-1">
              Privacy and terms links, contact or about pages, form labels, image alt text, mobile
              viewport, page language, broken links, and security headers such as X-Frame-Options.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-800">Domain &amp; email (custom domains)</h3>
            <p className="mt-1">
              For your own domain we check SPF, DMARC, and DKIM records, domain registration
              expiry, and DNS. Platform subdomains such as vercel.app skip email DNS checks
              because you cannot configure them there.
            </p>
          </div>
        </div>
        <p className="mt-4">
          Results appear in plain English with copy-paste fix snippets where possible. Export to
          CSV or PDF, re-scan after changes, and use the Has &amp; Missing panel to prioritise
          fixes. Optional backlink data is available when DataForSEO credentials are configured.
          We use analytics cookies to improve SEOScan — see our Privacy Policy for details.
        </p>
      </div>
    </details>
  );
}

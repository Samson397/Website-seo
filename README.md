# Website SEO Auditor

A web app that analyzes any public website URL and produces a comprehensive audit report — **no API keys required**. Covers SEO, performance, accessibility, security, domain intelligence, and more, with explanations, severity ratings, and ready-to-copy fix snippets.

## Features

- **SEO audit** — title, meta description, H1, canonical, Open Graph tags, robots.txt, sitemap.xml, structured data
- **Content quality** — thin content detection, readability, content freshness signals
- **Mobile & social** — viewport meta, Twitter/X cards, favicon, Apple touch icon, URL structure
- **Image optimization** — missing dimensions, lazy loading, modern format suggestions
- **Performance** — server response time, HTML size, script/stylesheet count, compression headers
- **Accessibility** — alt text, form labels, language attribute, heading hierarchy
- **Security** — HTTPS, security headers, mixed content detection
- **Broken links** — checks up to 20 links on the page for 404s and unreachable URLs
- **Google SERP preview** — see how your title/description appear in search results
- **Re-scan comparison** — compare scores before and after fixes
- **Issue checklist** — mark issues done, hide resolved items
- **Export** — download CSV or print/PDF report
- **Full site scan** — crawl up to 10 pages via sitemap + links for duplicate titles/descriptions
- **Trust & legal** — privacy policy, terms of service, contact page links
- **Modern web** — manifest.json, llms.txt, www/non-www consistency
- **Domain intelligence** — registration expiry, SSL expiry, DNS (SPF/DMARC/DKIM)
- **Technology detection** — WordPress, Shopify, React, GA4, Cloudflare, etc.
- **Link profile** — internal and external link counts and top linked domains
- **Social profiles** — linked Facebook, Twitter/X, Instagram, LinkedIn, etc.
- **Fix snippets** — copy-paste HTML/meta fixes for each issue

## Use on Your Phone (No Local Setup)

1. Open **[Deploy to Vercel →](https://vercel.com/new/clone?repository-url=https://github.com/Samson397/Website-seo)**
2. Sign in with GitHub and click **Deploy**
3. Open your Vercel URL on your phone, paste any website, and tap **Analyze**

No API keys required for the full audit. Optional extras:

- `PAGESPEED_API_KEY` — Lighthouse Core Web Vitals scores
- `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` — backlink data

Add these in Vercel **Settings → Environment Variables** only if you want them. No user login or OAuth anywhere in the app.

---

## Getting Started (Local Development)

```bash
git clone https://github.com/Samson397/Website-seo.git
cd Website-seo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a URL, and click **Analyze**.

## Usage

1. Enter any public website URL (e.g. `https://example.com`)
2. Click **Analyze** and wait 10–60 seconds (site scan takes longer)
3. Review scores, site intelligence, and issues grouped by category
4. Click **Copy fix** on any issue to get a ready-to-paste snippet

## API

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "siteCrawl": true}'
```

Returns a JSON audit report with scores, issues, and fix snippets.

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cheerio](https://cheerio.js.org/) for HTML parsing
- [Vercel Analytics](https://vercel.com/docs/analytics)

## Deploy

Deploy to [Vercel](https://vercel.com/) with zero config. No environment variables required.

## License

MIT

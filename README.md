# Website SEO Auditor

A web app that analyzes any public website URL and produces a comprehensive audit report covering SEO, performance, accessibility, security, and broken links — with explanations, severity ratings, and ready-to-copy fix snippets.

## Features

- **SEO audit** — title, meta description, H1, canonical, Open Graph tags, robots.txt, sitemap.xml, structured data
- **Content quality** — thin content detection, readability, content freshness signals
- **Mobile & social** — viewport meta, Twitter/X cards, favicon, Apple touch icon, URL structure
- **Image optimization** — missing dimensions, lazy loading, modern format suggestions
- **Performance** — Core Web Vitals (LCP, CLS, INP) via Google PageSpeed Insights API, compression & caching headers
- **Accessibility** — alt text, form labels, language attribute, heading hierarchy, Lighthouse a11y score
- **Security** — HTTPS, security headers, mixed content detection
- **Broken links** — checks up to 20 links on the page for 404s and unreachable URLs
- **Google SERP preview** — see how your title/description appear in search results
- **Re-scan comparison** — compare scores before and after fixes
- **Issue checklist** — mark issues done, hide resolved items
- **Export** — download CSV or print/PDF report
- **Fix snippets** — copy-paste HTML/meta fixes for each issue

## Use on Your Phone (No Local Setup)

This app needs a server to fetch and analyze websites — it **cannot run locally on mobile Cursor**. Deploy it once to get a link you can open on any device:

### Option 1: Deploy to Vercel (recommended, free)

1. Open this link on your phone or computer:  
   **[Deploy to Vercel →](https://vercel.com/new/clone?repository-url=https://github.com/Samson397/Website-seo)**
2. Sign in with GitHub and click **Deploy**
3. Wait ~2 minutes — Vercel gives you a live URL like `https://website-seo-xxx.vercel.app`
4. Open that URL on your phone, paste any website, and tap **Analyze**

Optional: In Vercel project **Settings → Environment Variables**, add `PAGESPEED_API_KEY` for performance scores.

### Option 2: Deploy to Netlify (free)

1. Go to [app.netlify.com/start](https://app.netlify.com/start)
2. Import the `Samson397/Website-seo` repo from GitHub
3. Build command: `npm run build` · Publish directory: `.next` (or use Netlify's Next.js preset)
4. Deploy and use the Netlify URL on your phone

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- npm

**Note:** Local development requires a computer with Node.js installed. If you're on mobile Cursor, use the deployment options above instead.

### Installation

```bash
git clone https://github.com/Samson397/Website-seo.git
cd Website-seo
npm install
```

### Optional: PageSpeed API Key

Performance and Lighthouse accessibility scores require a free Google PageSpeed Insights API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the PageSpeed Insights API
3. Create an API key
4. Copy `.env.example` to `.env.local` and add your key:

```bash
cp .env.example .env.local
# Edit .env.local and set PAGESPEED_API_KEY=your_key_here
```

All other checks work without an API key.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a URL, and click **Analyze**.

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. Enter any public website URL (e.g. `https://example.com`)
2. Click **Analyze** and wait 10–30 seconds
3. Review scores and issues grouped by category
4. Click **Copy fix** on any issue to get a ready-to-paste snippet

## API

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Returns a JSON audit report with scores, issues, and fix snippets.

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cheerio](https://cheerio.js.org/) for HTML parsing
- [Google PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started) (optional)

## Deploy

Deploy to [Vercel](https://vercel.com/) with zero config. Set `PAGESPEED_API_KEY` as an environment variable in your deployment settings.

## License

MIT

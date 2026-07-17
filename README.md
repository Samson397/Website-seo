# SEOScan

Free **full-site** SEO, security, and accessibility auditor. Paste any public URL — no account.

Live: [seoscan-five.vercel.app](https://seoscan-five.vercel.app)

## What it does

- Crawls pages from sitemap + internal links (up to 200 pages per scan)
- Runs **50+ checks** grouped by SEO, content, technical, social, security, accessibility, trust, and performance
- Shows pass / fail / review results (not a vague “have / don’t have” list)
- Competitor compare (up to 10 sites)
- Free tools: meta/SERP preview, robots.txt & sitemap inspector, security headers checker
- Export CSV / print PDF

No login. No saved projects. No monitoring accounts.

---

## Deploy to Vercel

1. Open [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/Samson397/Website-seo)
2. Deploy — the scanner works without environment variables

### Optional env vars

| Variable | What it enables |
|----------|-----------------|
| `PAGESPEED_API_KEY` | Google Lighthouse Core Web Vitals |
| `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | Backlink data |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEOScan’s own SEO |

---

## Local development

```bash
git clone https://github.com/Samson397/Website-seo.git
cd Website-seo
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API

### Full site audit

```bash
curl -X POST https://your-site.vercel.app/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Pass `"siteCrawl": false` for a faster homepage-only audit (used by competitor compare).

### Setup / version

```bash
curl https://your-site.vercel.app/api/setup
curl https://your-site.vercel.app/api/version
```

---

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Cheerio for HTML analysis
- Vercel Analytics
- Optional PageSpeed + DataForSEO

## License

MIT

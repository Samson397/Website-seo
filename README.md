# SEOScan

Free **full-site** SEO, security, and accessibility auditor. Paste any public URL — no account.

Live: [seoscan-five.vercel.app](https://seoscan-five.vercel.app)

## What it does

- Crawls pages from sitemap + internal links (up to 200 pages per scan)
- Runs **50+ checks** grouped by SEO, content, technical, social, security, accessibility, trust, and performance
- Shows pass / fail / review results
- **Watchlist + recent scans** saved in the browser (come back weekly without an account)
- Competitor compare + free tools (meta preview, robots/sitemap, security headers)
- Private scan-insight storage (Vercel KV) — **not** a public leaderboard
- Optional **AdSense** slots
- Export CSV / print PDF

No login. No email signup. No private user profiles.

### Monetization

| Channel | How |
|--------|-----|
| Ads | Set `NEXT_PUBLIC_ADSENSE_CLIENT` (+ slot) |
| Insights data | Anonymized scan events (public hostnames + scores) |

We only keep facts about **public websites that were scanned** — not emails or private identity data.

**Store scan data (easiest → Vercel):**  
1. Vercel project → **Storage** → create **KV**  
2. Redeploy  
3. View key `seoscan:scan_events` in the KV browser (private)  
4. Optional: set `INSIGHTS_SECRET` and call `/api/insights` with that bearer token  

There is **no public `/benchmarks` page** — collected data is for you only.

Guide: [docs/vercel-kv-setup.md](docs/vercel-kv-setup.md)  
Optional Firebase instead: [docs/firebase-setup.md](docs/firebase-setup.md)

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
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV (auto when you create Storage → KV) |
| `INSIGHTS_SECRET` | Unlocks private `GET /api/insights` for you only |
| `FIREBASE_SERVICE_ACCOUNT` | Optional Firebase alternative |
| `DATA_WEBHOOK_URL` | Optional forward of scan events to Zapier/Make/n8n |
| `NEXT_PUBLIC_ADSENSE_CLIENT` / `NEXT_PUBLIC_ADSENSE_SLOT` | Small ads |

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

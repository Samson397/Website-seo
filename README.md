# SEOHub

Free **full SEO toolkit**: site audit, keyword research, rank checks, content optimizer, and 15+ tools. No account.

Live: your Vercel **Production** URL for the `seoscan` project (see [AdSense verification](docs/adsense-verification.md))

## What it does

- **Full site audit** — crawl up to 200 pages, 50+ pass/fail/review checks
- **Keyword research** — on-page phrases + Google suggestions (+ DataForSEO volume when configured)
- **Rank checker** — on-page keyword score + optional Google position (DataForSEO)
- **Content optimizer** — score pages against a target keyword
- **Keyword tracker** — save keywords on this device and re-check anytime
- **Watchlist + history** — weekly re-scan reminders in the browser
- **Tools** — meta preview, redirects, schema, broken links, headers, robots/sitemap inspect & generators
- **Compare & export** — competitor audits, CSV/JSON/PDF, shareable report links

No login. No email signup. No private user profiles.

### Freemium (optional Stripe)

When Stripe env vars are set:

- **Free** — homepage SEO preview + all toolkit pages
- **$0.99** — one full-site scan (up to 200 pages), shareable report, deeper site-wide checks

Paid via Stripe Checkout (one scan per payment). No account.

### Monetization

| Channel | How |
|--------|-----|
| Ads | Google AdSense (`ca-pub-4587075434685102`); optional `NEXT_PUBLIC_ADSENSE_SLOT` for fixed units |
| Insights data | Anonymized scan events (scores, tech, fails, AI score, CWV) |
| First-party email | Optional report/digest contacts for tips & product updates (not sold) |

We keep facts about **public websites that were scanned**, plus optional emails users provide.

**Access your data (private):**  
1. Vercel → **Storage** → confirm **Neon** is connected → redeploy  
2. Neon SQL Editor → tables `scan_events`, `email_contacts`, `digest_subscriptions`  
3. Set `INSIGHTS_SECRET` and call `GET /api/insights` with `Authorization: Bearer <secret>`  

There is **no public `/benchmarks` page** — collected data is for you only.

Guide: [docs/neon-setup.md](docs/neon-setup.md)  
Alternatives: [KV](docs/vercel-kv-setup.md) · [Firebase](docs/firebase-setup.md)

---

## Deploy to Vercel

1. Open [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/Samson397/Website-seo)
2. Deploy — the scanner works without environment variables

### Optional env vars

| Variable | What it enables |
|----------|-----------------|
| `PAGESPEED_API_KEY` | Google Lighthouse Core Web Vitals |
| `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | Backlinks, keyword volume, Google rank position |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEOHub’s own SEO |
| `DATABASE_URL` / `POSTGRES_URL` | Neon on Vercel Storage (usually auto) |
| `INSIGHTS_SECRET` | Unlocks private `GET /api/insights` for you only |
| `KV_REST_API_*` / `FIREBASE_SERVICE_ACCOUNT` | Optional alternatives |
| `DATA_WEBHOOK_URL` | Optional forward of scan events to Zapier/Make/n8n |
| `NEXT_PUBLIC_ADSENSE_CLIENT` / `NEXT_PUBLIC_ADSENSE_SLOT` | AdSense override + optional display slot (client defaults in code) |
| `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_PRICE_ID` | $0.99 per full-site scan |
| `DEEPSEEK_API_KEY` | AI priority fix plan on paid full reports |
| `DEEPSEEK_MODEL` | Optional model id (default `deepseek-chat`) |
| `NEXT_PUBLIC_STRIPE_PRICE_DISPLAY` | Price label (default `$0.99`) |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Email reports + weekly digests |
| `CRON_SECRET` | Auth for Monday weekly-digest cron |

Email setup: [docs/resend-setup.md](docs/resend-setup.md)

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

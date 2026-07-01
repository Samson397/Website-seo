# SEOScan

Free website SEO auditor with optional **accounts, saved sites, scan history, and weekly monitoring**.

Live: [seoscan-five.vercel.app](https://seoscan-five.vercel.app)

## What it does

**Without an account (always free)**
- Paste any URL → instant SEO, performance, accessibility, and security audit
- 35+ Has/Missing checklist in plain English
- Full site scan up to 30 pages
- Export CSV / PDF

**With a free account**
- Save up to 3 websites
- Scan history and score trends over time
- Weekly auto-rescan (when monitoring is enabled)
- Email alerts when scores drop or critical issues appear (optional)

---

## Deploy to Vercel (step by step)

### 1. Deploy the app (no keys needed)

1. Open [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/Samson397/Website-seo)
2. Deploy — the **scanner works immediately** without any environment variables

### 2. Add a database (for accounts)

1. In Vercel → your project → **Storage** → create **Postgres** (or use [Neon](https://neon.tech) free tier)
2. Connect it to the project — Vercel sets `DATABASE_URL` automatically

### 3. Add required env vars (accounts)

In Vercel → **Settings → Environment Variables**, add:

| Variable | How to get it |
|----------|---------------|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste the result |
| `NEXTAUTH_URL` | Your site URL, e.g. `https://seoscan-five.vercel.app` |

Redeploy. The build runs `prisma db push` automatically when `DATABASE_URL` is set.

### 4. Verify setup

Visit `https://your-site.vercel.app/api/setup` — you should see `"accountsReady": true`.

Then go to `/register` and create an account.

### 5. Optional extras (add when you want them)

| Variable | What it enables |
|----------|-----------------|
| `CRON_SECRET` | Weekly monitoring cron (any random string) |
| `RESEND_API_KEY` | Email alerts via [Resend](https://resend.com) |
| `EMAIL_FROM` | Sender for alerts, e.g. `SEOScan <alerts@yourdomain.com>` |
| `PAGESPEED_API_KEY` | Google Lighthouse Core Web Vitals |
| `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | Backlink data |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for your own site's SEO |

**Cron:** Vercel sends `Authorization: Bearer <CRON_SECRET>` to `/api/cron/monitor` every Monday 9:00 UTC when `CRON_SECRET` is set.

---

## Local development

```bash
git clone https://github.com/Samson397/Website-seo.git
cd Website-seo
npm install
cp .env.example .env.local
# Edit .env.local — add DATABASE_URL and NEXTAUTH_SECRET for accounts
npm run db:push   # create tables (first time only)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Check setup: [http://localhost:3000/api/setup](http://localhost:3000/api/setup)

---

## API

### Scan a URL (no auth)

```bash
curl -X POST https://your-site.vercel.app/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "siteCrawl": false}'
```

### Setup status

```bash
curl https://your-site.vercel.app/api/setup
```

### Projects (auth required — browser session)

Sign in at `/login`, then use the dashboard or:

- `GET /api/projects` — list your sites
- `POST /api/projects` — `{ "url": "https://example.com" }`
- `POST /api/projects/{id}/scan` — run a saved scan

---

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (email/password)
- Cheerio, Vercel Analytics, optional Resend + PageSpeed + DataForSEO

## License

MIT

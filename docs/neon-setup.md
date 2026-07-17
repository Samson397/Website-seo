# SEOScan → Neon (Vercel Postgres) setup

You already have **Neon** under Vercel Storage — use that. No Firebase or KV needed.

## 1. Confirm Neon is connected

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Open your **SEOScan** project
3. Go to **Storage**
4. You should see your **Neon** database connected to the project

Vercel usually injects env vars automatically, for example:

- `DATABASE_URL` or
- `POSTGRES_URL`

If the store is connected to the project, you’re done with this step.

## 2. Redeploy

1. **Deployments** → latest → **⋯** → **Redeploy**

After redeploy, every successful scan writes a row into table **`scan_events`**  
(created automatically on first scan).

## 3. View your data in Neon

**From Vercel**

1. Storage → your Neon database → open the Neon dashboard / query UI

**Or Neon console**

1. [console.neon.tech](https://console.neon.tech)
2. Open the project
3. **SQL Editor** → run:

```sql
SELECT hostname, overall, seo, security, pages_scanned, scanned_at
FROM scan_events
ORDER BY scanned_at DESC
LIMIT 50;
```

## 4. Private API (optional)

1. Vercel → Settings → Environment Variables
2. Add `INSIGHTS_SECRET` = a long random string (e.g. from `openssl rand -hex 32`)
3. Redeploy
4. Call:

```bash
curl -H "Authorization: Bearer YOUR_SECRET" https://YOUR-PRODUCTION-DOMAIN/api/insights
```

This is private — not linked on the public site.

## Priority

If multiple stores are configured, SEOScan uses them in this order:

1. **Neon / Postgres** (`DATABASE_URL` / `POSTGRES_URL`) ← your case
2. Vercel KV
3. Firebase

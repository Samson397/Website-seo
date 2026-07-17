# SEOScan → Vercel KV setup (easiest)

Store anonymized scan data **inside Vercel**. No Firebase. No Postgres. No JSON keys to copy by hand.

## 1. Open your Vercel project

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Open the **SEOScan** project

## 2. Create KV storage

1. Click the **Storage** tab
2. Click **Create Database** / **Connect Store**
3. Choose **KV** (Redis)
4. Name it e.g. `seoscan-kv`
5. Select the same project region if asked
6. Click **Create** / **Connect**

Vercel automatically adds env vars to your project:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- (and usually `KV_URL`, `KV_REST_API_READ_ONLY_TOKEN`)

## 3. Redeploy

1. Go to **Deployments**
2. Open the latest deployment → **⋯** → **Redeploy**

(Or push any commit.)

## 4. Check it works

1. Visit your site and run a scan
2. Open Vercel → **Storage** → your KV database → **Data** browser  
   (or open the linked Upstash console)
3. Look for key: `seoscan:scan_events`

Each scan pushes one JSON entry (hostname, scores, pages scanned, etc.).

## 5. Public benchmarks

Open:

`https://your-site.vercel.app/benchmarks`

Averages are calculated from the KV list.

## Notes

- Free KV tier is enough to start (we keep the newest ~5,000 scans).
- If both Vercel KV **and** Firebase are configured, **Vercel KV is used first**.
- Still no emails or private user data — only public-site scan stats.

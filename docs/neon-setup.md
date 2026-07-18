# SEOHub → Neon on Vercel (your setup)

You already have Neon connected, e.g. **neon-apricot-blanket**.  
SEOHub uses the official `@neondatabase/serverless` driver + `DATABASE_URL` (same as the Vercel Neon Quickstart).

## 1. Confirm the project is linked

1. Vercel → SEOHub project → **Storage**
2. Open **neon-apricot-blanket** (or your Neon install)
3. Make sure it is connected to this Vercel project (env vars available)

Vercel injects `DATABASE_URL` / `POSTGRES_URL` automatically.

## 2. (Optional) Create the table yourself in Neon SQL Editor

You can skip this — the app also creates the table on first scan.  
Or create it now:

1. Storage → Neon → **Open in Neon Console**
2. **SQL Editor** → run:

```sql
CREATE TABLE IF NOT EXISTS scan_events (
  id BIGSERIAL PRIMARY KEY,
  hostname TEXT NOT NULL,
  tld TEXT,
  overall SMALLINT,
  seo SMALLINT,
  performance SMALLINT,
  accessibility SMALLINT,
  security SMALLINT,
  pass_count SMALLINT,
  fail_count SMALLINT,
  attention_count SMALLINT,
  pages_scanned INTEGER,
  critical_issues SMALLINT,
  warning_issues SMALLINT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  technologies JSONB DEFAULT '[]'::jsonb,
  top_fail_ids JSONB DEFAULT '[]'::jsonb,
  ai_score SMALLINT,
  lcp TEXT,
  cls TEXT,
  inp TEXT,
  tier TEXT,
  has_spf BOOLEAN,
  has_dmarc BOOLEAN,
  has_ssl BOOLEAN
);

CREATE INDEX IF NOT EXISTS scan_events_scanned_at_idx ON scan_events (scanned_at DESC);
CREATE INDEX IF NOT EXISTS scan_events_hostname_idx ON scan_events (hostname);

-- Optional: shareable report snapshots (/r/[id])
CREATE TABLE IF NOT EXISTS shared_reports (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  hostname TEXT NOT NULL,
  overall SMALLINT,
  report_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shared_reports_created_at_idx
ON shared_reports (created_at DESC);

-- Optional: weekly email digests (Resend)
CREATE TABLE IF NOT EXISTS digest_subscriptions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  sites JSONB NOT NULL DEFAULT '[]'::jsonb,
  unsub_token TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS digest_subscriptions_email_idx
ON digest_subscriptions (email);

-- Optional: email report / digest contacts (first-party)
CREATE TABLE IF NOT EXISTS email_contacts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  hostname TEXT,
  url TEXT,
  source TEXT NOT NULL DEFAULT 'report',
  marketing_ok BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_contacts_email_idx ON email_contacts (email);
CREATE INDEX IF NOT EXISTS email_contacts_created_at_idx ON email_contacts (created_at DESC);
```

If `scan_events` already exists, the app adds new columns automatically on the next scan (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`).

## 3. Redeploy SEOHub

Deployments → latest → **Redeploy**  
(so production has `DATABASE_URL`)

## 4. Run a scan on your live site

After one successful scan, rows appear in `scan_events`.

## 5. View your data (private)

In Neon SQL Editor:

```sql
-- Rich scan telemetry
SELECT hostname, overall, technologies, top_fail_ids, ai_score, tier, lcp, scanned_at
FROM scan_events
ORDER BY scanned_at DESC
LIMIT 50;

-- Emails that opted into tips / digests
SELECT email, hostname, source, marketing_ok, created_at
FROM email_contacts
WHERE marketing_ok = TRUE
ORDER BY created_at DESC;

-- Weekly digest watchlists
SELECT email, sites, active, created_at
FROM digest_subscriptions
ORDER BY created_at DESC;
```

Optional private API (JSON export of stats + recent rows):

1. Add env var `INSIGHTS_SECRET` (random long string)
2. Redeploy
3. Call:

```bash
curl -H "Authorization: Bearer YOUR_SECRET" https://YOUR-PRODUCTION-DOMAIN/api/insights
```

Response includes `stats`, `recentEvents`, `contacts`, and `recentContacts`.  
No public page shows this data.

## Local testing (optional)

```bash
vercel env pull .env.development.local
npm run dev
```

That pulls `DATABASE_URL` from Vercel so local scans also write to Neon.

# SEOHub → Resend (email reports + weekly digests)

## 1. Install Resend on Vercel

1. Vercel → SEOHub project → **Integrations** / **Storage** (or [resend.com](https://resend.com) → API Keys)
2. Create an API key
3. Verify a sending domain (or use `onboarding@resend.dev` for tests only)

## 2. Environment variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` | `re_...` | Send emails |
| `RESEND_FROM_EMAIL` | `SEOHub <reports@yourdomain.com>` | From address (must be verified) |
| `CRON_SECRET` | random hex | Protects weekly digest cron |
| `DATABASE_URL` | (Neon) | Required to store digest subscriptions |

Also ensure Neon is connected so `digest_subscriptions` can be created.

## 3. Features

- **Email report** — on any scan result, “Email report” sends a summary (+ share link when Neon is available)
- **Weekly digest** — on History, sign up with watchlist sites; Vercel Cron runs Mondays 09:00 UTC → `/api/cron/weekly-digest`

## 4. Cron auth

Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set in the project.

Manual test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-domain.com/api/cron/weekly-digest"
```

## 5. Privacy

Emails are only stored for digest subscribers (Neon). Report emails are one-shot — address is not saved unless they also subscribe to digests. Unsubscribe link is included in every digest.

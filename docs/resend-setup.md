# SEOHub → Resend (email reports + weekly digests)

Follow the [Resend Node.js SDK](https://resend.com/docs) patterns: `RESEND_API_KEY` in env, verified domain `from`, and `{ data, error }` handling.

## 1. Prerequisites (human)

1. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
2. Verify your sending domain at [resend.com/domains](https://resend.com/domains)
3. Store the key in Vercel as `RESEND_API_KEY` — never hardcode it

## 2. Environment variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` | `re_...` | SDK auth |
| `RESEND_FROM_EMAIL` | `SEOHub <reports@seohub.online>` | `from` — **must** use a verified domain |
| `CRON_SECRET` | random hex | Protects weekly digest cron |
| `DATABASE_URL` | (Neon) | Digest subscriptions |

`onboarding@resend.dev` is **test-only**. Production must use your verified domain in `RESEND_FROM_EMAIL`.

Optional local test recipients from Resend (do not invent fake addresses):

- `delivered@resend.dev`
- `bounced@resend.dev`
- `complained@resend.dev`
- `suppressed@resend.dev`

## 3. How SEOHub sends

Wrapper: `src/lib/resend.ts`

```ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send(
  {
    from: process.env.RESEND_FROM_EMAIL!,
    to: ["user@example.com"],
    subject: "…",
    html: "<p>…</p>",
  },
  { idempotencyKey: "audit-report/…" }
);
```

- Package: `resend` (already in `package.json`)
- Body parameters: camelCase (`replyTo`, `scheduledAt`, `tags`)
- Idempotency: second argument `{ idempotencyKey }` → `Idempotency-Key` header
- Keys used: `audit-report/…`, `digest-confirm/…`, `weekly-digest/<id>/<week>`
- Cron spacing (~120ms) stays under Resend’s default **10 req/s** limit

## 4. Features

- **Email report** — scan result → `/api/email/report`
- **Weekly digest** — History signup; Vercel Cron Mondays 09:00 UTC → `/api/cron/weekly-digest`

## 5. Cron auth

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.seohub.online/api/cron/weekly-digest"
```

## 6. Verify

`/api/setup` → Resend row ok when both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set.

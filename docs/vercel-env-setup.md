# Put SEOHub secrets on Vercel (required for payments)

Payments fail with “not configured” until these exist on the **Vercel project** and you **redeploy**.

## Steps

1. Open [vercel.com](https://vercel.com) → your SEOHub project  
2. **Settings** → **Environment Variables**  
3. Add each key below for **Production** (and Preview if you test there)  
4. **Deployments** → ⋯ on latest → **Redeploy**

## Required for $0.99 unlock

| Name | Value |
|------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_…` (test) or `sk_live_…` (real charges) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Matching `pk_test_…` / `pk_live_…` (same mode as secret) |
| `STRIPE_PRICE_ID` | Price ID from **the same Stripe account + mode** (e.g. `price_…`) |
| `NEXT_PUBLIC_STRIPE_PRICE_DISPLAY` | `$0.99` (must match the Stripe Price ID amount) |
| `NEXT_PUBLIC_SITE_URL` | Canonical production URL, e.g. `https://your-app.vercel.app` |

Notes:

- Secret key, publishable key, and price ID must all be **test** or all **live** — never mix.
- Checkout uses Stripe-hosted redirect; card payments only (instant unlock).
- `NEXT_PUBLIC_SITE_URL` is preferred for Stripe success/cancel URLs in production.

## Recommended

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon connection string (shareable reports) |
| `RESEND_API_KEY` | `re_…` |
| `RESEND_FROM_EMAIL` | `SEOHub <reports@yourdomain.com>` |
| `CRON_SECRET` | `openssl rand -hex 32` |

## Verify

After redeploy, open:

- `/api/stripe/status` → `"enabled": true`
- `/api/setup` → Stripe row ok

In **test mode**, Stripe’s card `4242 4242 4242 4242` works. Live mode needs a real card.

## CLI (optional)

```bash
npx vercel login
npx vercel link
npx vercel env add STRIPE_SECRET_KEY production
# paste value when prompted — repeat for each key
npx vercel --prod
```

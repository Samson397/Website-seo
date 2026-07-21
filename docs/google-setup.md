# Google Analytics + Search Console + OAuth setup (SEOHub)

Wire four pieces: **GA4 site tag**, **admin Google connect** (after code login), **GA4 Data API** reports, and **Search Console** reports in `/admin`.

**Never commit client secrets or service-account JSON.** Put them in Vercel env (or local `.env.local`).

If a client secret was pasted in chat or a ticket, **rotate it** in Google Cloud Console when you can.

## 1. Enable APIs (Cloud Console)

On project `seohubonline`:

1. [Enable Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)
2. [Enable Search Console API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com)
3. [Enable PageSpeed Insights API](https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com) (optional; uses `PAGESPEED_API_KEY`)

## 2. GA4 Measurement ID (page tracking)

1. Open [Google Analytics](https://analytics.google.com/) → create a **GA4** property + **Web** data stream for `https://www.seohub.online`.
2. Copy the **Measurement ID** (`G-XXXXXXXX`).
3. Vercel → Environment Variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXX` |

4. Redeploy. Tags load only after cookie consent = **Accept**.

## 3. OAuth Web client (admin “Connect Google” after code login)

Admin login is **only** `ADMIN_SECRET` (the code). Google is connected **inside** `/admin` after you sign in — it is not a login method.

1. [Google Cloud Console](https://console.cloud.google.com/) → project `seohubonline`.
2. **APIs & Services** → **OAuth consent screen** → add scopes:
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/analytics.readonly`
   - `https://www.googleapis.com/auth/webmasters.readonly`
3. Add your email as a **test user** while the app is in Testing.
4. **Credentials** → OAuth client (**Web application**).
5. **Authorized JavaScript origins**: `https://www.seohub.online`
6. **Authorized redirect URIs** — keep the registered homepage (middleware rewrites `/?code&state` → callback):

   `https://www.seohub.online`

   Optional extra (recommended later):

   `https://www.seohub.online/api/auth/google/callback`

7. Vercel env:

| Name | Value |
|------|--------|
| `GOOGLE_CLIENT_ID` | `….apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-…` |
| `GOOGLE_ADMIN_EMAILS` | Optional allowlist of Google emails (comma-separated). Leave empty to allow any account after code login. |
| `GOOGLE_REDIRECT_URI` | `https://www.seohub.online` |
| `ADMIN_SECRET` | Owner code (required for `/admin`) |

8. Redeploy → `/admin` → sign in with **ADMIN_SECRET** → open **GA4** or **Search Console** → **Connect Google**.

Scopes requested: OpenID profile + Analytics readonly + Search Console readonly.

## 4. GA4 Data API (admin → GA4)

### Option A — Service account (recommended)

1. Create a **service account** → download JSON key.
2. In GA4: **Admin** → **Property access management** → add the service account email as **Viewer**.
3. Copy the numeric **Property ID**.
4. Vercel:

| Name | Value |
|------|--------|
| `GA4_PROPERTY_ID` | `123456789` |
| `GA_SERVICE_ACCOUNT` | Full JSON key as one line |

### Option B — OAuth refresh (no service account)

1. Set `GA4_PROPERTY_ID`.
2. Sign in at `/admin` with your admin code, then **Connect Google**.
3. `/admin` → **GA4** uses the sealed refresh cookie.

## 5. Search Console (admin → Search Console)

1. [Search Console](https://search.google.com/search-console) → add and verify `https://www.seohub.online/` (or domain property `sc-domain:seohub.online`).
2. Connect the Google account that owns that property (optionally listed in `GOOGLE_ADMIN_EMAILS`).
3. Optional Vercel override:

| Name | Value |
|------|--------|
| `GSC_SITE_URL` | `https://www.seohub.online/` |

4. After code login, connect Google once (must grant Search Console scope), then open `/admin` → **Search Console**.

You’ll see clicks, impressions, CTR, average position, top queries, and top pages.

## Verify

| Check | Expect |
|-------|--------|
| Cookie Accept on the site | Network calls to `googletagmanager.com` / `google-analytics.com` (when Measurement ID set) |
| `/admin` without session → `/api/auth/google` | Redirects back asking to sign in with ADMIN_SECRET first |
| `/admin` after code login → Connect Google | Redirects to Google, then back with refresh cookie |
| `/admin` Overview health | Google OAuth / GA4 / GSC rows |
| `/admin` → GA4 | Users, views, top pages (after data exists) |
| `/admin` → Search Console | Clicks / impressions (after property verified + data exists) |

## Security notes

- Keep `GOOGLE_CLIENT_SECRET` and service-account JSON **server-only** (never `NEXT_PUBLIC_*`).
- Admin access is gated by `ADMIN_SECRET` only; Google connect never creates an admin session.
- Optionally restrict connected accounts with `GOOGLE_ADMIN_EMAILS`.
- Rotate any secret that was shared in chat when you can.

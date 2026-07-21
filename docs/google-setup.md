# Google Analytics + OAuth setup (SEOHub)

Wire three pieces: **GA4 site tag**, **admin Google sign-in**, and **GA4 Data API** reports in `/admin` → GA4.

**Never commit client secrets or service-account JSON.** Put them in Vercel env (or local `.env.local`).

If a client secret was pasted in chat or a ticket, **rotate it** in Google Cloud Console first.

## 1. GA4 Measurement ID (page tracking)

1. Open [Google Analytics](https://analytics.google.com/) → create a **GA4** property + **Web** data stream for `https://www.seohub.online`.
2. Copy the **Measurement ID** (`G-XXXXXXXX`).
3. Vercel → Environment Variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXX` |

4. Redeploy. Tags load only after cookie consent = **Accept** (same gate as first-party Visitors).

## 2. OAuth Web client (admin “Continue with Google”)

1. [Google Cloud Console](https://console.cloud.google.com/) → project (e.g. `seohubonline`).
2. **APIs & Services** → **OAuth consent screen** → External (or Internal) → add your email as a test user while in Testing.
3. **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**.
4. **Authorized JavaScript origins**: `https://www.seohub.online`
5. **Authorized redirect URIs** (required):

   `https://www.seohub.online/api/auth/google/callback`

   Local (optional): `http://localhost:3000/api/auth/google/callback`

6. Copy **Client ID** and **Client secret** into Vercel:

| Name | Value |
|------|--------|
| `GOOGLE_CLIENT_ID` | `….apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-…` (rotated if exposed) |
| `GOOGLE_ADMIN_EMAILS` | Your Google email(s), comma-separated |
| `ADMIN_SECRET` | Existing owner secret (still required; password login remains) |

Optional: `GOOGLE_REDIRECT_URI` if the callback URL must differ from `NEXT_PUBLIC_SITE_URL + /api/auth/google/callback`.

7. Redeploy → `/admin` → **Continue with Google**. Only emails in `GOOGLE_ADMIN_EMAILS` get a session.

Scopes requested: `openid email profile` + Analytics readonly (for the GA4 admin tab when no service account is set).

## 3. GA4 Data API (admin reports)

### Option A — Service account (recommended)

1. Enable **Google Analytics Data API** on the Cloud project.
2. Create a **service account** → download JSON key.
3. In GA4: **Admin** → **Property access management** → add the service account email as **Viewer**.
4. Copy the numeric **Property ID** (Admin → Property settings), not the `G-` id.
5. Vercel:

| Name | Value |
|------|--------|
| `GA4_PROPERTY_ID` | `123456789` |
| `GA_SERVICE_ACCOUNT` | Full JSON key as one line |

You can also reuse `GOOGLE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT` if that account has Viewer on the property.

### Option B — OAuth refresh (no service account)

1. Set `GA4_PROPERTY_ID` as above.
2. Enable **Google Analytics Data API**.
3. Sign in at `/admin` with **Continue with Google** (grants Analytics readonly).
4. A sealed refresh token cookie is stored; `/admin` → **GA4** uses it to pull reports.

Grant your Google user **Viewer** (or higher) on the GA4 property.

## Verify

| Check | Expect |
|-------|--------|
| Cookie Accept on the site | Network calls to `googletagmanager.com` / `google-analytics.com` |
| `/admin` Overview health | GA4 measurement / Data API / Google sign-in rows |
| `/admin` → GA4 | Users, views, top pages (after data exists) |

## Security notes

- Keep `GOOGLE_CLIENT_SECRET` and service-account JSON **server-only** (never `NEXT_PUBLIC_*`).
- Restrict `GOOGLE_ADMIN_EMAILS` tightly.
- Password login via `ADMIN_SECRET` still works as a backup.

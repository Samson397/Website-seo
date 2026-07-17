# SEOScan → Firebase setup (simple)

This stores anonymized public-site scan data in **Firestore**.  
No emails. No user accounts. You view everything in the Firebase console.

## 1. Create a Firebase project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it e.g. `seoscan`
3. Disable Google Analytics if you want (optional) → Create project

## 2. Create Firestore

1. In the left menu → **Build** → **Firestore Database**
2. Click **Create database**
3. Start in **production mode**
4. Pick a region close to you → Enable

## 3. Create a service account key

1. Click the gear ⚙️ next to **Project overview** → **Project settings**
2. Open the **Service accounts** tab
3. Click **Generate new private key** → **Generate key**
4. A JSON file downloads — keep it private

## 4. Add the key to Vercel

1. Open the downloaded JSON file
2. Copy the **entire** file contents
3. Go to your Vercel project → **Settings** → **Environment Variables**
4. Add:

| Name | Value |
|------|--------|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the full JSON (one line is fine) |

Important: if Vercel/UI messes up newlines in `private_key`, paste the whole JSON as one env var named `FIREBASE_SERVICE_ACCOUNT` (recommended).

5. Redeploy the site

## 5. See your data

1. Run a scan on your live SEOScan site
2. Open Firebase → **Firestore Database**
3. Open collection **`scan_events`**
4. Each scan adds a document with hostname, scores, pages scanned, etc.

## 6. Public benchmarks

After a few scans, open:

`https://your-site.vercel.app/benchmarks`

Averages update from Firestore automatically.

## Optional: separate fields instead of JSON

If you prefer 3 env vars instead of one JSON blob:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Use the values from the downloaded JSON (`project_id`, `client_email`, `private_key`).

## Security note

- Never commit the JSON key to GitHub
- Never put it in `NEXT_PUBLIC_…` env vars
- Server-only (API routes) use this key

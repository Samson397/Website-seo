# AdSense site verification

Publisher: `ca-pub-4587075434685102`

## Why “Couldn’t verify your site” happens

Google’s crawler must fetch your **public production** homepage and see either:

- `<meta name="google-adsense-account" content="ca-pub-4587075434685102">`, or
- the `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-…` script

It must also reach `https://YOUR-DOMAIN/ads.txt`.

### Common blockers on this project

1. **Vercel Deployment Protection** — if Production (or the URL you entered in AdSense) shows a Vercel login / “Authentication Required” wall, Google cannot see the tags.  
   Fix: Vercel → Project **seoscan** → **Settings** → **Deployment Protection** → turn protection **off for Production** (or add a public custom domain that is not protected).
2. **Wrong domain in AdSense** — `seohub.vercel.app` is not this app. Use the exact public domain that serves SEOHub (your Vercel production domain or custom domain).
3. **Changes not on Production** — merge the AdSense PR to `main` and wait for the Production deploy to finish before clicking Verify.

## Checklist after deploy

In an **incognito** window (no Vercel login):

1. Open `https://YOUR-DOMAIN/` → View Source → search for `google-adsense-account` and `ca-pub-4587075434685102`
2. Open `https://YOUR-DOMAIN/ads.txt` → should return plain text:  
   `google.com, pub-4587075434685102, DIRECT, f08c47fec0942fa0`
3. In AdSense → Sites, add/verify **exactly** that host (no `https://`, usually without `www` unless that is your canonical)

Then retry **Verify**. If it still fails, wait and retry once the public HTML clearly shows the meta tag (Google can lag briefly after deploy).

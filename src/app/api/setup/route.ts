import { NextResponse } from "next/server";
import { getStoreBackend, isStoreConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

type Check = { key: string; label: string; ok: boolean; required: boolean };

function checks(): Check[] {
  const backend = getStoreBackend();
  return [
    {
      key: "NEON",
      label: "Neon / Vercel Postgres (scan storage)",
      ok: backend === "neon",
      required: false,
    },
    {
      key: "VERCEL_KV",
      label: "Vercel KV (optional alternative)",
      ok: backend === "vercel-kv",
      required: false,
    },
    {
      key: "FIREBASE",
      label: "Firebase Firestore (optional alternative)",
      ok: backend === "firebase",
      required: false,
    },
    {
      key: "INSIGHTS_SECRET",
      label: "Private insights API secret",
      ok: Boolean(process.env.INSIGHTS_SECRET),
      required: false,
    },
    {
      key: "ADMIN_SECRET",
      label: "Admin console (/admin) — or reuse INSIGHTS_SECRET",
      ok: Boolean(
        (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length >= 8) ||
          (process.env.INSIGHTS_SECRET && process.env.INSIGHTS_SECRET.length >= 8)
      ),
      required: false,
    },
    {
      key: "PAGESPEED_API_KEY",
      label: "Google PageSpeed scores",
      ok: Boolean(process.env.PAGESPEED_API_KEY),
      required: false,
    },
    {
      key: "DATAFORSEO",
      label: "DataForSEO backlinks",
      ok: Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
      required: false,
    },
    {
      key: "ADSENSE",
      label: "Google AdSense ads",
      ok: true,
      required: false,
    },
    {
      key: "STRIPE",
      label: "Stripe Checkout ($4.99 full SEO unlock)",
      ok: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
      required: false,
    },
    {
      key: "RESEND",
      label: "Resend (email reports + digests)",
      ok: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      required: false,
    },
    {
      key: "CRON_SECRET",
      label: "Cron secret (weekly digest)",
      ok: Boolean(process.env.CRON_SECRET),
      required: false,
    },
  ];
}

export async function GET() {
  const items = checks();
  const optionalOk = items.filter((c) => c.ok).length;

  return NextResponse.json({
    app: "seohub",
    scannerReady: true,
    storeReady: isStoreConfigured(),
    storeBackend: getStoreBackend(),
    publicBenchmarks: false,
    checks: items,
    optionalConfigured: optionalOk,
    setupDocs: {
      neon: "docs/neon-setup.md",
      vercelKv: "docs/vercel-kv-setup.md",
      firebase: "docs/firebase-setup.md",
    },
    urls: {
      home: "/",
      history: "/history",
      competitors: "/competitors",
      tools: "/tools",
      privateInsights: "/api/insights",
      version: "/api/version",
    },
  });
}

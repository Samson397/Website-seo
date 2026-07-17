import { NextResponse } from "next/server";
import { getStoreBackend, isStoreConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

type Check = { key: string; label: string; ok: boolean; required: boolean };

function checks(): Check[] {
  const backend = getStoreBackend();
  return [
    {
      key: "VERCEL_KV",
      label: "Vercel KV (recommended scan storage)",
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
      ok: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
      required: false,
    },
  ];
}

export async function GET() {
  const items = checks();
  const optionalOk = items.filter((c) => c.ok).length;

  return NextResponse.json({
    app: "seoscan",
    scannerReady: true,
    storeReady: isStoreConfigured(),
    storeBackend: getStoreBackend(),
    checks: items,
    optionalConfigured: optionalOk,
    setupDocs: {
      vercelKv: "docs/vercel-kv-setup.md",
      firebase: "docs/firebase-setup.md",
    },
    urls: {
      home: "/",
      competitors: "/competitors",
      tools: "/tools",
      benchmarks: "/benchmarks",
      version: "/api/version",
    },
  });
}

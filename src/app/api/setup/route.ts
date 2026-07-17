import { NextResponse } from "next/server";
import { isStoreConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

type Check = { key: string; label: string; ok: boolean; required: boolean };

function checks(): Check[] {
  return [
    {
      key: "FIREBASE",
      label: "Firebase Firestore (scan data)",
      ok: isStoreConfigured(),
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
    firebaseReady: isStoreConfigured(),
    checks: items,
    optionalConfigured: optionalOk,
    urls: {
      home: "/",
      competitors: "/competitors",
      tools: "/tools",
      benchmarks: "/benchmarks",
      firebaseSetup: "/docs not served — see repo docs/firebase-setup.md",
      version: "/api/version",
    },
  });
}

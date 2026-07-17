import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Check = { key: string; label: string; ok: boolean; required: boolean };

function checks(): Check[] {
  return [
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
  ];
}

export async function GET() {
  const items = checks();
  const optionalOk = items.filter((c) => c.ok).length;

  return NextResponse.json({
    app: "seoscan",
    scannerReady: true,
    accountsReady: false,
    checks: items,
    optionalConfigured: optionalOk,
    urls: {
      home: "/",
      competitors: "/competitors",
      tools: "/tools",
      version: "/api/version",
    },
  });
}

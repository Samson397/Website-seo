import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Check = { key: string; label: string; ok: boolean; required: boolean };

function checks(): Check[] {
  return [
    { key: "DATABASE_URL", label: "PostgreSQL database", ok: Boolean(process.env.DATABASE_URL), required: true },
    { key: "NEXTAUTH_SECRET", label: "Auth secret", ok: Boolean(process.env.NEXTAUTH_SECRET), required: true },
    { key: "NEXTAUTH_URL", label: "Auth URL (your site URL)", ok: Boolean(process.env.NEXTAUTH_URL), required: true },
    { key: "CRON_SECRET", label: "Weekly monitoring cron", ok: Boolean(process.env.CRON_SECRET), required: false },
    { key: "RESEND_API_KEY", label: "Email alerts (Resend)", ok: Boolean(process.env.RESEND_API_KEY), required: false },
    { key: "EMAIL_FROM", label: "Alert sender address", ok: Boolean(process.env.EMAIL_FROM), required: false },
    { key: "PAGESPEED_API_KEY", label: "Google PageSpeed scores", ok: Boolean(process.env.PAGESPEED_API_KEY), required: false },
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
  const requiredOk = items.filter((c) => c.required).every((c) => c.ok);
  const optionalOk = items.filter((c) => !c.required).filter((c) => c.ok).length;

  let databaseConnected = false;
  if (isDatabaseConfigured()) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch {
      databaseConnected = false;
    }
  }

  const accountsReady = requiredOk && databaseConnected;

  return NextResponse.json({
    app: "seoscan",
    accountsReady,
    databaseConnected,
    scannerReady: true,
    checks: items,
    missingRequired: items.filter((c) => c.required && !c.ok).map((c) => c.key),
    optionalConfigured: optionalOk,
    urls: {
      register: "/register",
      dashboard: "/dashboard",
      version: "/api/version",
    },
  });
}

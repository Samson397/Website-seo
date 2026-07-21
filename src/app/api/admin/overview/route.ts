import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getStoreBackend, getBenchmarkStats, isStoreConfigured } from "@/lib/store";
import { canUsePromoCodes, listAllPromoCodesAdmin } from "@/lib/promo-codes";
import { canPersistReports, listReportsAdmin } from "@/lib/reports";
import { isStripeConfigured } from "@/lib/stripe";
import { listRecentCheckoutsAdmin } from "@/lib/stripe-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function healthChecks() {
  const backend = getStoreBackend();
  return [
    { key: "NEON", label: "Neon / Postgres", ok: backend === "neon" },
    { key: "STRIPE", label: "Stripe Checkout", ok: isStripeConfigured() },
    {
      key: "RESEND",
      label: "Resend email",
      ok: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    },
    { key: "PAGESPEED", label: "PageSpeed API", ok: Boolean(process.env.PAGESPEED_API_KEY) },
    { key: "PROMO_DB", label: "Promo codes DB", ok: canUsePromoCodes() },
    { key: "REPORTS_DB", label: "Shared reports DB", ok: canPersistReports() },
    {
      key: "ADMIN",
      label: "Admin secret",
      ok: Boolean(
        (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length >= 8) ||
          (process.env.INSIGHTS_SECRET && process.env.INSIGHTS_SECRET.length >= 8)
      ),
    },
    {
      key: "ANALYTICS",
      label: "Visitor analytics DB",
      ok: Boolean(
        process.env.DATABASE_URL ||
          process.env.POSTGRES_URL ||
          process.env.POSTGRES_PRISMA_URL ||
          process.env.POSTGRES_URL_NON_POOLING
      ),
    },
    {
      key: "GA4_MEASUREMENT",
      label: "GA4 measurement ID",
      ok: Boolean(
        process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID &&
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID.startsWith("G-")
      ),
    },
    {
      key: "GA4_DATA",
      label: "GA4 Data API",
      ok: Boolean(
        (process.env.GA4_PROPERTY_ID || process.env.GOOGLE_ANALYTICS_PROPERTY_ID) &&
          (process.env.GA_SERVICE_ACCOUNT ||
            process.env.GOOGLE_SERVICE_ACCOUNT ||
            (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET))
      ),
    },
    {
      key: "GOOGLE_OAUTH",
      label: "Google connect (OAuth)",
      ok: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    {
      key: "GSC",
      label: "Search Console OAuth",
      ok: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  ];
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, promos, reports, payments] = await Promise.all([
      getBenchmarkStats(),
      canUsePromoCodes() ? listAllPromoCodesAdmin() : Promise.resolve([]),
      canPersistReports() ? listReportsAdmin(5) : Promise.resolve([]),
      listRecentCheckoutsAdmin(5),
    ]);

    const activePromos = promos.filter((p) => p.active && p.remaining > 0);
    const paidSessions = payments.sessions.filter((s) => s.paymentStatus === "paid");

    return NextResponse.json({
      health: healthChecks(),
      storeReady: isStoreConfigured(),
      storeBackend: getStoreBackend(),
      stats: {
        source: stats.source,
        sampleSize: stats.sampleSize,
        avgOverall: stats.avgOverall,
        avgSeo: stats.avgSeo,
      },
      counts: {
        activePromoCodes: activePromos.length,
        promoRemaining: activePromos.reduce((n, p) => n + p.remaining, 0),
        recentReports: reports.length,
        recentPaidCheckouts: paidSessions.length,
      },
      recentPaid: paidSessions.slice(0, 5),
      recentReports: reports,
    });
  } catch (err) {
    console.error("[admin/overview]", err);
    return NextResponse.json({ error: "Could not load overview." }, { status: 500 });
  }
}

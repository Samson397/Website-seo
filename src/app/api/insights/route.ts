import { NextRequest, NextResponse } from "next/server";
import {
  getBenchmarkStats,
  getStoreBackend,
  isStoreConfigured,
  loadRecentEvents,
} from "@/lib/store";
import {
  canPersistEmailContacts,
  emailContactStats,
  loadRecentEmailContacts,
} from "@/lib/email-contacts";

/**
 * Private owner-only insights export.
 * Requires: Authorization: Bearer <INSIGHTS_SECRET>
 * Never linked from the public site.
 */
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.INSIGHTS_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const queryKey = request.nextUrl.searchParams.get("key") || "";
  return bearer === secret || queryKey === secret;
}

export async function GET(request: NextRequest) {
  if (!process.env.INSIGHTS_SECRET) {
    return NextResponse.json(
      {
        error:
          "Insights API is locked. Set INSIGHTS_SECRET in Vercel env vars, then call with Authorization: Bearer <secret>.",
      },
      { status: 503 }
    );
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backend = getStoreBackend();
  const stats = await getBenchmarkStats();
  let recentEvents: unknown[] = [];
  let recentContacts: unknown[] = [];
  let contacts = {
    total: 0,
    marketingOk: 0,
    bySource: { report: 0, digest: 0 },
  };

  try {
    recentEvents = await loadRecentEvents(100);
  } catch (err) {
    console.error("[insights] events", err);
  }

  try {
    contacts = await emailContactStats();
    recentContacts = await loadRecentEmailContacts(100);
  } catch (err) {
    console.error("[insights] contacts", err);
  }

  return NextResponse.json({
    ok: true,
    storeConfigured: isStoreConfigured(),
    emailContactsConfigured: canPersistEmailContacts(),
    backend,
    stats,
    contacts,
    recentEvents,
    recentContacts,
    access: {
      neonTables: ["scan_events", "email_contacts", "digest_subscriptions", "shared_reports"],
      sqlExamples: {
        scans:
          "SELECT hostname, overall, technologies, top_fail_ids, ai_score, tier, scanned_at FROM scan_events ORDER BY scanned_at DESC LIMIT 50;",
        marketingEmails:
          "SELECT email, hostname, source, marketing_ok, created_at FROM email_contacts WHERE marketing_ok = TRUE ORDER BY created_at DESC;",
        digests:
          "SELECT email, sites, active, created_at FROM digest_subscriptions ORDER BY created_at DESC;",
      },
    },
  });
}

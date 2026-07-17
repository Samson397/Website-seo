import { NextRequest, NextResponse } from "next/server";
import {
  getBenchmarkStats,
  getStoreBackend,
  isStoreConfigured,
  loadRecentEvents,
} from "@/lib/store";

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
  try {
    recentEvents = await loadRecentEvents(100);
  } catch (err) {
    console.error("[insights]", err);
  }

  return NextResponse.json({
    ok: true,
    storeConfigured: isStoreConfigured(),
    backend,
    stats,
    recentEvents,
  });
}

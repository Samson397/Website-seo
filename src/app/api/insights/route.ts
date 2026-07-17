import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  SCAN_EVENTS_COLLECTION,
  SCAN_EVENTS_KV_KEY,
  getBenchmarkStats,
  getStoreBackend,
  isStoreConfigured,
} from "@/lib/store";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";

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
    if (backend === "vercel-kv") {
      const raw = await kv.lrange<string>(SCAN_EVENTS_KV_KEY, 0, 99);
      recentEvents = raw.map((item) => {
        try {
          return typeof item === "string" ? JSON.parse(item) : item;
        } catch {
          return item;
        }
      });
    } else if (backend === "firebase" && isFirebaseConfigured()) {
      const db = getFirebaseDb();
      if (db) {
        const snap = await db
          .collection(SCAN_EVENTS_COLLECTION)
          .orderBy("scannedAt", "desc")
          .limit(100)
          .get();
        recentEvents = snap.docs.map((d) => d.data());
      }
    }
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

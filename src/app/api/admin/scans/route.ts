import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getBenchmarkStats, getStoreBackend, loadRecentEvents } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [stats, events] = await Promise.all([
      getBenchmarkStats(),
      loadRecentEvents(60),
    ]);
    return NextResponse.json({
      backend: getStoreBackend(),
      stats,
      events,
    });
  } catch (err) {
    console.error("[admin/scans]", err);
    return NextResponse.json({ error: "Could not load scans." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getVisitorAnalyticsSummary } from "@/lib/visitor-analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getVisitorAnalyticsSummary({ onlineMinutes: 5 });
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[admin/visitors]", err);
    return NextResponse.json({ error: "Could not load visitor analytics." }, { status: 500 });
  }
}

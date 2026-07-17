import { NextResponse } from "next/server";

/**
 * Public benchmarks endpoint removed — scan insights are private.
 * Owners should use GET /api/insights with INSIGHTS_SECRET, or the Vercel KV console.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "Public benchmarks are disabled. Use /api/insights with your INSIGHTS_SECRET, or view seoscan:scan_events in Vercel KV.",
    },
    { status: 410 }
  );
}

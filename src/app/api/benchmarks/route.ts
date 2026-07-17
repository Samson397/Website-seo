import { NextResponse } from "next/server";
import { getBenchmarkStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getBenchmarkStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

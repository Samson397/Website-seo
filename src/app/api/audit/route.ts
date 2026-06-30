import { NextRequest, NextResponse } from "next/server";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urlInput = body?.url;

    if (!urlInput || typeof urlInput !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await validateUrlSafe(urlInput);
    const normalized = normalizeUrl(urlInput);
    const report = await runFullAudit(normalized);

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    const status = message.includes("not allowed") || message.includes("resolve") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

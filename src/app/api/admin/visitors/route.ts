import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  getVisitorAnalyticsSummary,
  updateAnalyticsSettings,
} from "@/lib/visitor-analytics";

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

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const settings = await updateAnalyticsSettings({
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      blockBots: typeof body.blockBots === "boolean" ? body.blockBots : undefined,
      blockedCountries:
        typeof body.blockedCountries === "string" ? body.blockedCountries : undefined,
      blockedIpHashes:
        typeof body.blockedIpHashes === "string" ? body.blockedIpHashes : undefined,
      blockedPathPrefixes:
        typeof body.blockedPathPrefixes === "string" ? body.blockedPathPrefixes : undefined,
      digestEnabled: typeof body.digestEnabled === "boolean" ? body.digestEnabled : undefined,
      digestEmail: typeof body.digestEmail === "string" ? body.digestEmail : undefined,
    });
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("[admin/visitors PATCH]", err);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runFullAudit } from "@/lib/audit";
import { normalizeUrl, validateUrlSafe } from "@/lib/fetcher";
import { getCurrentUser } from "@/lib/session";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { saveScan } from "@/lib/scans";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urlInput = body?.url;
    const siteCrawl = body?.siteCrawl === true;
    const projectId = typeof body?.projectId === "string" ? body.projectId : undefined;

    if (!urlInput || typeof urlInput !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await validateUrlSafe(urlInput);
    const normalized = normalizeUrl(urlInput);
    const report = await runFullAudit(normalized, { siteCrawl });

    if (projectId && isDatabaseConfigured()) {
      const user = await getCurrentUser();
      if (user) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, userId: user.id },
        });
        if (project) {
          await saveScan(project.id, report, "manual");
        }
      }
    }

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    const status = message.includes("not allowed") || message.includes("resolve") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

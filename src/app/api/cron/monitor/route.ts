import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { runFullAudit } from "@/lib/audit";
import { validateUrlSafe } from "@/lib/fetcher";
import { saveScan } from "@/lib/scans";

export const maxDuration = 300;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const dueBefore = new Date(Date.now() - WEEK_MS);

  const projects = await prisma.project.findMany({
    where: {
      monitorEnabled: true,
      OR: [{ lastScanAt: null }, { lastScanAt: { lt: dueBefore } }],
    },
    include: {
      scans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: 10,
  });

  const results: { projectId: string; status: string }[] = [];

  for (const project of projects) {
    try {
      await validateUrlSafe(project.url);
      const report = await runFullAudit(project.url, {
        siteCrawl: project.siteCrawl,
      });

      await saveScan(project.id, report, "scheduled");

      results.push({ projectId: project.id, status: "ok" });
    } catch (err) {
      results.push({
        projectId: project.id,
        status: err instanceof Error ? err.message : "failed",
      });
    }
  }

  return NextResponse.json({ scanned: results.length, results });
}

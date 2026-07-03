import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { runFullAudit } from "@/lib/audit";
import { validateUrlSafe } from "@/lib/fetcher";
import { saveScan, compareScans, parseStoredReport } from "@/lib/scans";

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      scans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    await validateUrlSafe(project.url);
    const report = await runFullAudit(project.url, {
      siteCrawl: project.siteCrawl,
    });

    const previousReport = parseStoredReport(project.scans[0]?.report);
    const scan = await saveScan(project.id, report, "manual");

    const alerts = previousReport ? compareScans(previousReport, report) : [];

    return NextResponse.json({ report, scanId: scan.id, alerts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scanId = new URL(_request.url).searchParams.get("scanId");

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const scan = await prisma.scan.findFirst({
    where: {
      projectId: project.id,
      ...(scanId ? { id: scanId } : {}),
    },
    orderBy: scanId ? undefined : { createdAt: "desc" },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json({ report: scan.report });
}

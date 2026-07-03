import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { runUptimeCheckForProject } from "@/lib/uptime-monitor";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const projects = await prisma.project.findMany({
    where: { uptimeEnabled: true },
    take: 25,
  });

  const results = [];

  for (const project of projects) {
    try {
      const result = await runUptimeCheckForProject(project);
      results.push(result);
    } catch (err) {
      results.push({
        projectId: project.id,
        status: "error",
        error: err instanceof Error ? err.message : "failed",
      });
    }
  }

  return NextResponse.json({ checked: results.length, results });
}

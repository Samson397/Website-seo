import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { runUptimeCheckForProject } from "@/lib/uptime-monitor";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
    include: { user: { select: { email: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = await runUptimeCheckForProject(project);

  const latest = await prisma.project.findUnique({
    where: { id: project.id },
    select: {
      lastUptimeStatus: true,
      lastUptimeAt: true,
      lastUptimeMs: true,
      lastUptimeHttpStatus: true,
      lastSslExpiryDays: true,
    },
  });

  return NextResponse.json({ result, uptime: latest });
}

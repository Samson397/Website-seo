import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { normalizeUrl } from "@/lib/fetcher";
import { MAX_PROJECTS_PER_USER, saveScan, parseStoredReport } from "@/lib/scans";

const createProjectSchema = z.object({
  url: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  siteCrawl: z.boolean().optional(),
  monitorEnabled: z.boolean().optional(),
  uptimeEnabled: z.boolean().optional(),
  report: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          createdAt: true,
          seoScore: true,
          performanceScore: true,
          accessibilityScore: true,
          securityScore: true,
          criticalCount: true,
          warningCount: true,
          trigger: true,
        },
      },
    },
  });

  return NextResponse.json({ projects, limit: MAX_PROJECTS_PER_USER });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
    }

    const count = await prisma.project.count({ where: { userId: user.id } });
    if (count >= MAX_PROJECTS_PER_USER) {
      return NextResponse.json(
        { error: `Free plan allows up to ${MAX_PROJECTS_PER_USER} sites. Remove one to add another.` },
        { status: 403 }
      );
    }

    const url = normalizeUrl(parsed.data.url);
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        url,
        name: parsed.data.name || hostname,
        siteCrawl: parsed.data.siteCrawl ?? false,
        monitorEnabled: parsed.data.monitorEnabled ?? true,
        uptimeEnabled: parsed.data.uptimeEnabled ?? true,
      },
    });

    const initialReport = parseStoredReport(parsed.data.report);
    if (initialReport) {
      await saveScan(project.id, initialReport, "manual");
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "This site is already in your dashboard." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

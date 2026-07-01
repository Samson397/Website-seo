import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  siteCrawl: z.boolean().optional(),
  maxPages: z.number().int().min(2).max(30).optional(),
  monitorEnabled: z.boolean().optional(),
});

async function getOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
  });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
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
      scans: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          createdAt: true,
          trigger: true,
          seoScore: true,
          performanceScore: true,
          accessibilityScore: true,
          securityScore: true,
          criticalCount: true,
          warningCount: true,
          infoCount: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(params.id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: parsed.data,
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(params.id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: project.id } });
  return NextResponse.json({ ok: true });
}

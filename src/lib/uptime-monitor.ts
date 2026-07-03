import { prisma } from "@/lib/db";
import { checkUptime } from "@/lib/uptime";
import { fetchSslInfo } from "@/lib/audit/domain-intel";

const SSL_RECHECK_MS = 24 * 60 * 60 * 1000;

interface ProjectWithUser {
  id: string;
  name: string;
  url: string;
  lastUptimeStatus: string | null;
  lastSslExpiryDays: number | null;
  lastSslCheckAt: Date | null;
}

export async function runUptimeCheckForProject(project: ProjectWithUser) {
  const result = await checkUptime(project.url);
  const now = new Date();

  await prisma.uptimeCheck.create({
    data: {
      projectId: project.id,
      status: result.status,
      httpStatus: result.httpStatus,
      responseMs: result.responseMs,
      error: result.error,
    },
  });

  await prisma.project.update({
    where: { id: project.id },
    data: {
      lastUptimeStatus: result.status,
      lastUptimeAt: now,
      lastUptimeMs: result.responseMs,
      lastUptimeHttpStatus: result.httpStatus ?? null,
    },
  });

  const shouldCheckSsl =
    !project.lastSslCheckAt ||
    now.getTime() - project.lastSslCheckAt.getTime() > SSL_RECHECK_MS;

  if (shouldCheckSsl) {
    try {
      const hostname = new URL(project.url).hostname;
      const ssl = await fetchSslInfo(hostname);

      await prisma.project.update({
        where: { id: project.id },
        data: {
          lastSslExpiryDays: ssl.daysUntilExpiry ?? null,
          lastSslCheckAt: now,
        },
      });
    } catch {
      // SSL check is best-effort
    }
  }

  return { projectId: project.id, status: result.status };
}

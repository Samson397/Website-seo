import { prisma } from "@/lib/db";
import { checkUptime } from "@/lib/uptime";
import { fetchSslInfo } from "@/lib/audit/domain-intel";
import { sendAlertEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { formatUrlDisplay } from "@/lib/url-display";

const UPTIME_ALERT_COOLDOWN_MS = 60 * 60 * 1000;
const SSL_ALERT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SSL_WARN_DAYS = 30;
const SSL_RECHECK_MS = 24 * 60 * 60 * 1000;

interface ProjectWithUser {
  id: string;
  name: string;
  url: string;
  lastUptimeStatus: string | null;
  uptimeAlertedAt: Date | null;
  lastSslExpiryDays: number | null;
  lastSslCheckAt: Date | null;
  sslAlertedAt: Date | null;
  user: { email: string | null };
}

export async function runUptimeCheckForProject(project: ProjectWithUser) {
  const result = await checkUptime(project.url);
  const now = new Date();
  const dashboardUrl = `${getSiteUrl()}/dashboard/projects/${project.id}`;
  const displayUrl = formatUrlDisplay(project.url);

  await prisma.uptimeCheck.create({
    data: {
      projectId: project.id,
      status: result.status,
      httpStatus: result.httpStatus,
      responseMs: result.responseMs,
      error: result.error,
    },
  });

  const previousStatus = project.lastUptimeStatus;
  const wentDown = result.status === "down" && previousStatus !== "down";
  const recovered = result.status === "up" && previousStatus === "down";

  await prisma.project.update({
    where: { id: project.id },
    data: {
      lastUptimeStatus: result.status,
      lastUptimeAt: now,
      lastUptimeMs: result.responseMs,
      lastUptimeHttpStatus: result.httpStatus ?? null,
    },
  });

  if (!project.user.email) {
    return { projectId: project.id, status: result.status, emailed: false };
  }

  let emailed = false;

  if (wentDown) {
    const recentlyAlerted =
      project.uptimeAlertedAt &&
      now.getTime() - project.uptimeAlertedAt.getTime() < UPTIME_ALERT_COOLDOWN_MS;

    if (!recentlyAlerted) {
      emailed = await sendAlertEmail({
        to: project.user.email,
        subject: `SEOScan: ${displayUrl} is DOWN`,
        body: `Your site ${displayUrl} appears to be down.\n\n${
          result.error || `HTTP ${result.httpStatus ?? "error"}`
        }\n\nChecked at ${now.toISOString()}\n\nView dashboard: ${dashboardUrl}`,
      });
      if (emailed) {
        await prisma.project.update({
          where: { id: project.id },
          data: { uptimeAlertedAt: now },
        });
      }
    }
  }

  if (recovered) {
    emailed = await sendAlertEmail({
      to: project.user.email,
      subject: `SEOScan: ${displayUrl} is back online`,
      body: `Good news — ${displayUrl} is responding again.\n\nResponse time: ${result.responseMs}ms\nHTTP ${result.httpStatus ?? 200}\n\nView dashboard: ${dashboardUrl}`,
    });
    await prisma.project.update({
      where: { id: project.id },
      data: { uptimeAlertedAt: null },
    });
  }

  const shouldCheckSsl =
    !project.lastSslCheckAt ||
    now.getTime() - project.lastSslCheckAt.getTime() > SSL_RECHECK_MS;

  if (shouldCheckSsl) {
    try {
      const hostname = new URL(project.url).hostname;
      const ssl = await fetchSslInfo(hostname);
      const days = ssl.daysUntilExpiry;

      await prisma.project.update({
        where: { id: project.id },
        data: {
          lastSslExpiryDays: days ?? null,
          lastSslCheckAt: now,
        },
      });

      if (
        days !== undefined &&
        days <= SSL_WARN_DAYS &&
        project.user.email
      ) {
        const sslRecentlyAlerted =
          project.sslAlertedAt &&
          now.getTime() - project.sslAlertedAt.getTime() < SSL_ALERT_COOLDOWN_MS;

        if (!sslRecentlyAlerted) {
          const sslSent = await sendAlertEmail({
            to: project.user.email,
            subject: `SEOScan: SSL expiring in ${days} days — ${displayUrl}`,
            body: `The SSL certificate for ${displayUrl} expires in ${days} day${
              days === 1 ? "" : "s"
            }.\n\nRenew it before visitors see security warnings.\n\nView dashboard: ${dashboardUrl}`,
          });
          if (sslSent) {
            await prisma.project.update({
              where: { id: project.id },
              data: { sslAlertedAt: now },
            });
            emailed = true;
          }
        }
      }
    } catch {
      // SSL check is best-effort
    }
  }

  return { projectId: project.id, status: result.status, emailed };
}

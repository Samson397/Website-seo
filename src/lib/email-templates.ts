import { APP_NAME } from "@/lib/brand";
import type { AiFixPlan } from "@/lib/ai-fix-plan-types";
import { aiFixPlanHtmlSection, aiFixPlanPlainText } from "@/lib/ai-fix-plan-export";
import type { AuditReport } from "@/lib/types";
import type { DigestSite } from "@/lib/digest";
import { formatTen, formatTenLabel, overallFromScores } from "@/lib/score-display";

export function reportEmailHtml(opts: {
  report: AuditReport;
  shareUrl?: string | null;
  siteUrl: string;
  plan?: AiFixPlan | null;
}): { subject: string; html: string; text: string } {
  const { report, shareUrl, siteUrl, plan } = opts;
  let host = report.url;
  try {
    host = new URL(report.url).hostname;
  } catch {
    /* keep */
  }
  const score = overallFromScores(report.scores);
  const subject = `${APP_NAME} report — ${host} (${formatTenLabel(score)})`;

  const issues = report.issues
    .slice(0, 8)
    .map(
      (i) =>
        `<li style="margin:0 0 8px"><strong>${i.severity}</strong> — ${escapeHtml(i.title)}</li>`
    )
    .join("");

  const planHtml = plan ? aiFixPlanHtmlSection(plan) : "";

  const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#0c1222;line-height:1.5;max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#0d9488;font-weight:700">${APP_NAME}</p>
  <h1 style="font-size:28px;margin:8px 0 16px">Your SEO report for ${escapeHtml(host)}</h1>
  <p>Overall <strong>${formatTenLabel(score)}</strong> · SEO ${formatTen(report.scores.seo)} · Speed ${formatTen(report.scores.performance)} · A11y ${formatTen(report.scores.accessibility)} · Security ${formatTen(report.scores.security)} · AI ${formatTen(report.scores.ai ?? 0)}</p>
  <p>${report.summary.critical} critical · ${report.summary.warning} warnings · ${report.summary.info} info</p>
  ${shareUrl ? `<p><a href="${shareUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">Open full report</a></p>` : ""}
  ${planHtml}
  <h2 style="font-size:18px;margin-top:28px">Top issues</h2>
  <ul style="padding-left:18px">${issues || "<li>No issues listed</li>"}</ul>
  <p style="margin-top:28px;font-size:13px;color:#5b6b85"><a href="${siteUrl}">Run another scan on ${APP_NAME}</a></p>
</body></html>`;

  const text = `${APP_NAME} report for ${host}
Overall ${formatTenLabel(score)}. SEO ${formatTen(report.scores.seo)}, Speed ${formatTen(report.scores.performance)}, A11y ${formatTen(report.scores.accessibility)}, Security ${formatTen(report.scores.security)}.
${shareUrl ? `Full report: ${shareUrl}` : ""}
${plan ? `\n${aiFixPlanPlainText(plan)}\n` : ""}
Scan again: ${siteUrl}`;

  return { subject, html, text };
}

export function digestEmailHtml(opts: {
  sites: DigestSite[];
  siteUrl: string;
  unsubUrl: string;
}): { subject: string; html: string; text: string } {
  const { sites, siteUrl, unsubUrl } = opts;
  const subject = `${APP_NAME} weekly watchlist — ${sites.length} site${sites.length === 1 ? "" : "s"}`;

  const rows = sites
    .map((s) => {
      let score = "Not scanned yet";
      if (s.lastOverall != null) {
        const delta =
          s.previousOverall != null ? s.lastOverall - s.previousOverall : null;
        const deltaLabel =
          delta == null ? "" : delta === 0 ? " (unchanged)" : delta > 0 ? ` (+${delta})` : ` (${delta})`;
        score = `Score ${s.lastOverall}${deltaLabel}`;
      }
      const scan = `${siteUrl}/?url=${encodeURIComponent(s.url)}`;
      return `<li style="margin:0 0 12px"><strong>${escapeHtml(s.hostname)}</strong> — ${score}<br/><a href="${scan}">Open full scan</a></li>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#0c1222;line-height:1.5;max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#0d9488;font-weight:700">${APP_NAME}</p>
  <h1 style="font-size:26px;margin:8px 0 16px">Weekly watchlist digest</h1>
  <p>We re-checked each watched homepage and refreshed the scores below.</p>
  <ul style="padding-left:18px">${rows}</ul>
  <p style="margin-top:24px"><a href="${siteUrl}/history">Open History</a></p>
  <p style="margin-top:32px;font-size:12px;color:#5b6b85"><a href="${unsubUrl}">Unsubscribe from weekly digests</a></p>
</body></html>`;

  const text = `${APP_NAME} weekly watchlist\n\n${sites
    .map((s) => {
      const delta =
        s.lastOverall != null && s.previousOverall != null
          ? s.lastOverall - s.previousOverall
          : null;
      const deltaLabel =
        delta == null ? "" : delta === 0 ? " unchanged" : delta > 0 ? ` +${delta}` : ` ${delta}`;
      return `- ${s.hostname}: ${s.lastOverall != null ? s.lastOverall : "n/a"}${deltaLabel}`;
    })
    .join("\n")}\n\nUnsubscribe: ${unsubUrl}`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

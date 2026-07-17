"use client";

import type { AuditReport } from "@/lib/types";

interface ExportButtonsProps {
  report: AuditReport;
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function hostnameSlug(report: AuditReport) {
  try {
    return new URL(report.url).hostname.replace(/\./g, "-");
  } catch {
    return "site";
  }
}

function exportCsv(report: AuditReport) {
  const headers = [
    "Severity",
    "Category",
    "Title",
    "Description",
    "Recommendation",
    "Current Value",
  ];
  const rows = report.issues.map((i) =>
    [i.severity, i.category, i.title, i.description, i.recommendation, i.currentValue || ""]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  downloadBlob(csv, `seohub-${hostnameSlug(report)}-${Date.now()}.csv`, "text/csv;charset=utf-8");
}

function exportJson(report: AuditReport) {
  downloadBlob(
    JSON.stringify(report, null, 2),
    `seohub-${hostnameSlug(report)}-${Date.now()}.json`,
    "application/json"
  );
}

function exportPdfHtml(report: AuditReport) {
  const hostname = hostnameSlug(report);
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>SEOHub — ${hostname}</title>
<style>
  :root { --ink:#0c1222; --teal:#0d9488; --mist:#e8eef6; }
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 820px; margin: 2rem auto; padding: 0 1.25rem; color: var(--ink); line-height: 1.5; }
  h1,h2,h3 { font-family: Georgia, serif; letter-spacing: -0.02em; }
  .brand { color: var(--teal); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; font-family: system-ui, sans-serif; }
  .scores { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.75rem; margin: 1.25rem 0; }
  .score { background: var(--mist); padding: 0.85rem; border-radius: 12px; text-align: center; font-family: system-ui, sans-serif; }
  .score strong { font-size: 1.6rem; display: block; }
  .issue { border: 1px solid #d5dde8; border-radius: 12px; padding: 1rem; margin: 0.75rem 0; page-break-inside: avoid; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; font-family: system-ui, sans-serif; }
  .critical { background: #ffe4e6; color: #9f1239; }
  .warning { background: #fef3c7; color: #92400e; }
  .info { background: #ccfbf1; color: #115e59; }
  pre { background: #0c1222; color: #5eead4; padding: 0.75rem; border-radius: 8px; font-size: 0.75rem; overflow-x: auto; }
  @media print { body { margin: 0; } .noprint { display: none; } }
</style></head><body>
  <p class="brand">SEOHub report</p>
  <h1>Website audit</h1>
  <p><strong>URL:</strong> ${report.url}<br/>
  <strong>Scanned:</strong> ${new Date(report.scannedAt).toLocaleString()}
  ${report.shareId ? `<br/><strong>Share ID:</strong> ${report.shareId}` : ""}</p>
  <div class="scores">
    <div class="score"><strong>${report.scores.seo}</strong>SEO</div>
    <div class="score"><strong>${report.scores.performance}</strong>Performance</div>
    <div class="score"><strong>${report.scores.accessibility}</strong>Accessibility</div>
    <div class="score"><strong>${report.scores.security}</strong>Security</div>
  </div>
  <p class="noprint"><em>Tip: use your browser Print → Save as PDF for a PDF file.</em></p>
  <p>${report.summary.critical} critical · ${report.summary.warning} warnings · ${report.summary.info} info · ${report.issues.length} issues</p>
  <h2>Issues</h2>
  ${report.issues
    .map(
      (i) => `<div class="issue">
    <span class="badge ${i.severity}">${i.severity}</span>
    <strong> ${i.title}</strong>
    <p>${i.description}</p>
    ${i.currentValue ? `<p><em>Current:</em> ${i.currentValue}</p>` : ""}
    <p><em>Fix:</em> ${i.recommendation}</p>
    ${i.fixSnippet ? `<pre>${i.fixSnippet.replace(/</g, "&lt;")}</pre>` : ""}
  </div>`
    )
    .join("")}
  <script>window.onload=function(){window.print()}</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    downloadBlob(html, `seohub-${hostname}-${Date.now()}.html`, "text/html;charset=utf-8");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function ExportButtons({ report }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => exportCsv(report)}
        className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal/40 hover:bg-teal-soft"
      >
        CSV
      </button>
      <button
        type="button"
        onClick={() => exportJson(report)}
        className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal/40 hover:bg-teal-soft"
      >
        JSON
      </button>
      <button
        type="button"
        onClick={() => exportPdfHtml(report)}
        className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-bright"
      >
        PDF report
      </button>
    </div>
  );
}

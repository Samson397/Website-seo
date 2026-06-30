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

function exportCsv(report: AuditReport) {
  const headers = ["Severity", "Category", "Title", "Description", "Recommendation", "Current Value"];
  const rows = report.issues.map((i) =>
    [i.severity, i.category, i.title, i.description, i.recommendation, i.currentValue || ""]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const hostname = new URL(report.url).hostname.replace(/\./g, "-");
  downloadBlob(csv, `audit-${hostname}-${Date.now()}.csv`, "text/csv");
}

function exportPrint(report: AuditReport) {
  const hostname = new URL(report.url).hostname;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Audit Report - ${hostname}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; }
  h1 { font-size: 1.5rem; } h2 { font-size: 1.1rem; margin-top: 1.5rem; }
  .scores { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
  .score { background: #f1f5f9; padding: 0.75rem 1rem; border-radius: 8px; text-align: center; }
  .score strong { font-size: 1.5rem; display: block; }
  .issue { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 0.75rem 0; page-break-inside: avoid; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
  .critical { background: #fee2e2; color: #991b1b; }
  .warning { background: #fef3c7; color: #92400e; }
  .info { background: #dbeafe; color: #1e40af; }
  pre { background: #0f172a; color: #4ade80; padding: 0.75rem; border-radius: 6px; font-size: 0.75rem; overflow-x: auto; }
  @media print { body { margin: 0; } }
</style></head><body>
  <h1>Website Audit Report</h1>
  <p><strong>URL:</strong> ${report.url}</p>
  <p><strong>Scanned:</strong> ${new Date(report.scannedAt).toLocaleString()}</p>
  <div class="scores">
    <div class="score"><strong>${report.scores.seo}</strong>SEO</div>
    <div class="score"><strong>${report.scores.performance}</strong>Performance</div>
    <div class="score"><strong>${report.scores.accessibility}</strong>Accessibility</div>
    <div class="score"><strong>${report.scores.security}</strong>Security</div>
  </div>
  <p>${report.summary.critical} critical · ${report.summary.warning} warnings · ${report.summary.info} info</p>
  <h2>Issues (${report.issues.length})</h2>
  ${report.issues
    .map(
      (i) => `<div class="issue">
    <span class="badge ${i.severity}">${i.severity}</span>
    <strong>${i.title}</strong>
    <p>${i.description}</p>
    ${i.currentValue ? `<p><em>Current:</em> ${i.currentValue}</p>` : ""}
    <p><em>Fix:</em> ${i.recommendation}</p>
    ${i.fixSnippet ? `<pre>${i.fixSnippet.replace(/</g, "&lt;")}</pre>` : ""}
  </div>`
    )
    .join("")}
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }
}

export function ExportButtons({ report }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => exportCsv(report)}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Export CSV
      </button>
      <button
        onClick={() => exportPrint(report)}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Export PDF / Print
      </button>
    </div>
  );
}

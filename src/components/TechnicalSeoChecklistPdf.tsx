"use client";

import {
  TECHNICAL_SEO_CHECKLIST_SECTIONS,
  TECHNICAL_SEO_CHECKLIST_SUBTITLE,
  TECHNICAL_SEO_CHECKLIST_TITLE,
  checklistItemCount,
} from "@/lib/technical-seo-checklist";
import { APP_NAME, APP_ORIGIN } from "@/lib/brand";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

/** Opens a print-friendly HTML document (Print → Save as PDF), matching ExportButtons. */
export function exportTechnicalSeoChecklistPdf() {
  const count = checklistItemCount();
  const sectionsHtml = TECHNICAL_SEO_CHECKLIST_SECTIONS.map((section) => {
    const items = section.items
      .map(
        (item) => `<li class="item">
  <label><input type="checkbox" /> <strong>${escapeHtml(item.label)}</strong></label>
  <p class="hint">${escapeHtml(item.hint)}</p>
</li>`
      )
      .join("");
    return `<section class="section">
  <h2>${escapeHtml(section.title)}</h2>
  <p class="summary">${escapeHtml(section.summary)}</p>
  <ul>${items}</ul>
</section>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(TECHNICAL_SEO_CHECKLIST_TITLE)} — ${escapeHtml(APP_NAME)}</title>
<style>
  :root { --ink:#0c1222; --teal:#0f766e; --mist:#e8eef6; }
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 820px; margin: 2rem auto; padding: 0 1.25rem; color: var(--ink); line-height: 1.5; }
  h1,h2 { font-family: Georgia, serif; letter-spacing: -0.02em; }
  .brand { color: var(--teal); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; font-family: system-ui, sans-serif; }
  .lede { color: #4a5568; margin: 0.75rem 0 1.5rem; }
  .section { margin: 1.5rem 0; page-break-inside: avoid; }
  .section h2 { font-size: 1.35rem; margin: 0 0 0.35rem; border-bottom: 2px solid var(--mist); padding-bottom: 0.35rem; }
  .summary { font-size: 0.95rem; color: #4a5568; margin: 0 0 0.75rem; }
  ul { list-style: none; padding: 0; margin: 0; }
  .item { border: 1px solid #d5dde8; border-radius: 12px; padding: 0.85rem 1rem; margin: 0.5rem 0; page-break-inside: avoid; }
  .item label { font-family: system-ui, sans-serif; display: flex; gap: 0.5rem; align-items: flex-start; cursor: pointer; }
  .item input { margin-top: 0.2rem; }
  .hint { margin: 0.35rem 0 0 1.4rem; font-size: 0.9rem; color: #4a5568; }
  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #d5dde8; font-size: 0.85rem; color: #4a5568; font-family: system-ui, sans-serif; }
  @media print { body { margin: 0; } .noprint { display: none; } }
</style></head><body>
  <p class="brand">${escapeHtml(APP_NAME)} · Technical SEO Checklist</p>
  <h1>${escapeHtml(TECHNICAL_SEO_CHECKLIST_TITLE)}</h1>
  <p class="lede">${escapeHtml(TECHNICAL_SEO_CHECKLIST_SUBTITLE)} (${count} checks)</p>
  <p class="noprint"><em>Tip: use your browser Print → Save as PDF for a PDF file.</em></p>
  ${sectionsHtml}
  <p class="footer">Free checklist from ${escapeHtml(APP_NAME)}. Run a scan: ${escapeHtml(APP_ORIGIN)} · Interactive version: ${escapeHtml(APP_ORIGIN)}/checklist/technical-seo</p>
  <script>window.onload=function(){window.print()}</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    downloadBlob(html, `seohub-technical-seo-checklist.html`, "text/html;charset=utf-8");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function TechnicalSeoChecklistPdfButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={exportTechnicalSeoChecklistPdf}
      className={
        className ??
        "rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-bright"
      }
    >
      Technical SEO Checklist (PDF)
    </button>
  );
}

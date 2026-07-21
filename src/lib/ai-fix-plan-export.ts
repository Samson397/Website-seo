import type { AiFixPlan } from "@/lib/ai-fix-plan-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain-text brief suitable for email body or .txt download. */
export function aiFixPlanPlainText(plan: AiFixPlan): string {
  const lines: string[] = [
    "AI priority fix plan",
    "",
    "Executive summary",
    plan.executiveSummary,
  ];

  if (plan.projectedScoreNote) {
    lines.push("", plan.projectedScoreNote);
  }

  if (plan.priorityFixes.length) {
    lines.push("", "Do these first");
    plan.priorityFixes.forEach((fix, i) => {
      lines.push(
        `${i + 1}. [${fix.impact}] ${fix.title}`,
        `   Why: ${fix.why}`,
        `   Action: ${fix.action}`
      );
    });
  }

  if (plan.metaRewrites.length) {
    lines.push("", "Title & meta rewrites");
    for (const meta of plan.metaRewrites) {
      lines.push(
        `${meta.path}`,
        `  Title: ${meta.suggestedTitle}`,
        `  Meta: ${meta.suggestedDescription}`
      );
    }
  }

  if (plan.nextSteps.length) {
    lines.push("", "Next steps");
    for (const step of plan.nextSteps) lines.push(`- ${step}`);
  }

  if (plan.llmsTxtDraft) {
    lines.push("", "Draft llms.txt", plan.llmsTxtDraft);
  }

  return lines.join("\n");
}

/** HTML fragment for email / print PDF (already escaped). */
export function aiFixPlanHtmlSection(plan: AiFixPlan): string {
  const fixes = plan.priorityFixes
    .map(
      (fix, i) =>
        `<li style="margin:0 0 10px"><strong>${i + 1}. ${escapeHtml(fix.title)}</strong> <em>(${escapeHtml(fix.impact)})</em><br/>${escapeHtml(fix.why)}<br/><strong>Action:</strong> ${escapeHtml(fix.action)}</li>`
    )
    .join("");

  const metas = plan.metaRewrites
    .map(
      (meta) =>
        `<li style="margin:0 0 10px"><code>${escapeHtml(meta.path)}</code><br/><strong>Title:</strong> ${escapeHtml(meta.suggestedTitle)}<br/><strong>Meta:</strong> ${escapeHtml(meta.suggestedDescription)}</li>`
    )
    .join("");

  const steps = plan.nextSteps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("");

  return `<h2 style="font-size:18px;margin-top:28px">AI priority fix plan</h2>
  <p>${escapeHtml(plan.executiveSummary)}</p>
  ${plan.projectedScoreNote ? `<p><em>${escapeHtml(plan.projectedScoreNote)}</em></p>` : ""}
  ${fixes ? `<h3 style="font-size:15px;margin-top:18px">Do these first</h3><ol style="padding-left:18px">${fixes}</ol>` : ""}
  ${metas ? `<h3 style="font-size:15px;margin-top:18px">Title &amp; meta rewrites</h3><ul style="padding-left:18px">${metas}</ul>` : ""}
  ${steps ? `<h3 style="font-size:15px;margin-top:18px">Next steps</h3><ul style="padding-left:18px">${steps}</ul>` : ""}
  ${
    plan.llmsTxtDraft
      ? `<h3 style="font-size:15px;margin-top:18px">Draft llms.txt</h3><pre style="background:#0c1222;color:#5eead4;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap">${escapeHtml(plan.llmsTxtDraft)}</pre>`
      : ""
  }`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

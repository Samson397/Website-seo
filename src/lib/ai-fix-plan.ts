import type { AuditReport } from "@/lib/types";
import type { AiFixPlan, AiPriorityFix } from "@/lib/ai-fix-plan-types";
import { deepSeekChat } from "@/lib/deepseek";
import { overallFromScores } from "@/lib/score-display";

export type { AiFixPlan, AiPriorityFix } from "@/lib/ai-fix-plan-types";

function compactReport(report: AuditReport) {
  const issues = [...report.issues]
    .sort((a, b) => {
      const rank = { critical: 0, warning: 1, info: 2 };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 18)
    .map((i) => ({
      severity: i.severity,
      category: i.category,
      title: i.title,
      recommendation: i.recommendation.slice(0, 180),
      path: i.pagePath || i.pathTemplate,
    }));

  return {
    url: report.url,
    overall10: overallFromScores(report.scores),
    scores: report.scores,
    summary: report.summary,
    crawlPages: report.crawl?.pagesScanned ?? null,
    aiVisibility: report.aiVisibility
      ? {
          score: report.aiVisibility.score,
          botsBlocked: report.aiVisibility.botsBlocked,
          botsAllowed: report.aiVisibility.botsAllowed,
          fails: report.aiVisibility.signals
            .filter((s) => s.status !== "pass")
            .map((s) => s.label)
            .slice(0, 8),
        }
      : null,
    issues,
  };
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("No JSON object in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

function asFixPlan(data: unknown): AiFixPlan {
  const obj = data as Record<string, unknown>;
  const fixesRaw = Array.isArray(obj.priorityFixes) ? obj.priorityFixes : [];
  const priorityFixes: AiPriorityFix[] = fixesRaw.slice(0, 5).map((item) => {
    const f = item as Record<string, unknown>;
    const impact = f.impact === "high" || f.impact === "low" ? f.impact : "medium";
    return {
      title: String(f.title || "Fix").slice(0, 120),
      why: String(f.why || "").slice(0, 280),
      action: String(f.action || "").slice(0, 320),
      impact,
    };
  });

  const nextSteps = Array.isArray(obj.nextSteps)
    ? obj.nextSteps.map((s) => String(s).slice(0, 160)).slice(0, 5)
    : [];

  return {
    executiveSummary: String(obj.executiveSummary || "").slice(0, 500),
    projectedScoreNote: String(obj.projectedScoreNote || "").slice(0, 220),
    priorityFixes,
    llmsTxtDraft: String(obj.llmsTxtDraft || "").slice(0, 1200),
    nextSteps,
  };
}

export async function generateAiFixPlan(report: AuditReport): Promise<AiFixPlan> {
  const payload = compactReport(report);
  const content = await deepSeekChat(
    [
      {
        role: "system",
        content:
          "You are an expert SEO and AI-search (GEO) consultant. Reply with JSON only, no markdown prose. Be specific and actionable. Never invent pages that are not in the input.",
      },
      {
        role: "user",
        content: `Build a paid SEO audit brief from this scan JSON.

Return JSON with shape:
{
  "executiveSummary": "2-3 sentences for a founder/client",
  "projectedScoreNote": "one line on realistic /10 improvement if top fixes are done",
  "priorityFixes": [
    { "title": "", "why": "", "action": "", "impact": "high"|"medium"|"low" }
  ],
  "llmsTxtDraft": "short draft /llms.txt content for this site",
  "nextSteps": ["up to 5 short bullets"]
}

Rules:
- Exactly 3 to 5 priorityFixes, highest impact first
- Use only issues/signals from the scan
- Keep language plain, no fluff
- llmsTxtDraft should be ready to paste

Scan:
${JSON.stringify(payload)}`,
      },
    ],
    { temperature: 0.25, maxTokens: 1400 }
  );

  return asFixPlan(extractJson(content));
}

import type { AuditReport } from "@/lib/types";
import type {
  AiFixPlan,
  AiIssueRewrite,
  AiMetaRewrite,
  AiPriorityFix,
} from "@/lib/ai-fix-plan-types";
import { deepSeekChat } from "@/lib/deepseek";
import { overallFromScores, toTen } from "@/lib/score-display";

export type {
  AiFixPlan,
  AiIssueRewrite,
  AiMetaRewrite,
  AiPriorityFix,
} from "@/lib/ai-fix-plan-types";

function compactReport(report: AuditReport) {
  const issues = [...report.issues]
    .sort((a, b) => {
      const rank = { critical: 0, warning: 1, info: 2 };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 12)
    .map((i) => ({
      id: i.id,
      severity: i.severity,
      category: i.category,
      title: i.title,
      description: i.description.slice(0, 160),
      recommendation: i.recommendation.slice(0, 160),
      path: i.pagePath || i.pathTemplate,
    }));

  const pages = (report.crawl?.pages || [])
    .slice(0, 8)
    .map((p) => ({
      path: p.pathname || "/",
      title: (p.title || "").slice(0, 80),
      description: (p.description || "").slice(0, 140),
    }));

  if (pages.length === 0 && report.serpPreview) {
    pages.push({
      path: "/",
      title: report.serpPreview.title.slice(0, 80),
      description: report.serpPreview.description.slice(0, 140),
    });
  }

  return {
    url: report.url,
    // Model prompt asks for /10 notes — send the display scale, not 0–100.
    overall10: toTen(overallFromScores(report.scores)),
    scores: {
      seo: toTen(report.scores.seo),
      performance: toTen(report.scores.performance),
      accessibility: toTen(report.scores.accessibility),
      security: toTen(report.scores.security),
      ai: typeof report.scores.ai === "number" ? toTen(report.scores.ai) : null,
    },
    summary: report.summary,
    crawlPages: report.crawl?.pagesScanned ?? null,
    aiVisibility: report.aiVisibility
      ? {
          score: report.aiVisibility.score,
          botsBlocked: report.aiVisibility.botsBlocked,
          fails: report.aiVisibility.signals
            .filter((s) => s.status !== "pass")
            .map((s) => s.label)
            .slice(0, 8),
        }
      : null,
    pages,
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

  const metaRaw = Array.isArray(obj.metaRewrites) ? obj.metaRewrites : [];
  const metaRewrites: AiMetaRewrite[] = metaRaw.slice(0, 5).map((item) => {
    const m = item as Record<string, unknown>;
    return {
      path: String(m.path || "/").slice(0, 120),
      currentTitle: String(m.currentTitle || "").slice(0, 120),
      suggestedTitle: String(m.suggestedTitle || "").slice(0, 70),
      currentDescription: String(m.currentDescription || "").slice(0, 200),
      suggestedDescription: String(m.suggestedDescription || "").slice(0, 160),
    };
  });

  const issueRaw = Array.isArray(obj.issueRewrites) ? obj.issueRewrites : [];
  const issueRewrites: AiIssueRewrite[] = issueRaw.slice(0, 12).map((item) => {
    const i = item as Record<string, unknown>;
    return {
      issueId: String(i.issueId || "").slice(0, 80),
      plainEnglish: String(i.plainEnglish || "").slice(0, 280),
      action: String(i.action || "").slice(0, 280),
    };
  });

  const nextSteps = Array.isArray(obj.nextSteps)
    ? obj.nextSteps.map((s) => String(s).slice(0, 160)).slice(0, 5)
    : [];

  return {
    executiveSummary: String(obj.executiveSummary || "").slice(0, 500),
    projectedScoreNote: String(obj.projectedScoreNote || "").slice(0, 220),
    priorityFixes,
    metaRewrites,
    issueRewrites,
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
          "You are an expert SEO and AI-search (GEO) consultant. Reply with JSON only. Be specific and actionable. Never invent pages or issue ids that are not in the input.",
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
  "metaRewrites": [
    {
      "path": "/",
      "currentTitle": "",
      "suggestedTitle": "max ~60 chars",
      "currentDescription": "",
      "suggestedDescription": "max ~155 chars"
    }
  ],
  "issueRewrites": [
    { "issueId": "exact id from input", "plainEnglish": "", "action": "" }
  ],
  "llmsTxtDraft": "short draft /llms.txt content for this site",
  "nextSteps": ["up to 5 short bullets"]
}

Rules:
- Exactly 3 to 5 priorityFixes, highest impact first
- Up to 5 metaRewrites for the provided pages (homepage first)
- issueRewrites for the provided issues only — use exact issueId values
- plainEnglish must be clear for a non-SEO founder
- Keep language plain, no fluff
- llmsTxtDraft should be ready to paste

Scan:
${JSON.stringify(payload)}`,
      },
    ],
    { temperature: 0.25, maxTokens: 2200 }
  );

  return asFixPlan(extractJson(content));
}

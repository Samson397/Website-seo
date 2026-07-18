export interface AiPriorityFix {
  title: string;
  why: string;
  action: string;
  impact: "high" | "medium" | "low";
}

export interface AiMetaRewrite {
  path: string;
  currentTitle: string;
  suggestedTitle: string;
  currentDescription: string;
  suggestedDescription: string;
}

export interface AiIssueRewrite {
  issueId: string;
  plainEnglish: string;
  action: string;
}

export interface AiFixPlan {
  executiveSummary: string;
  projectedScoreNote: string;
  priorityFixes: AiPriorityFix[];
  metaRewrites: AiMetaRewrite[];
  issueRewrites: AiIssueRewrite[];
  llmsTxtDraft: string;
  nextSteps: string[];
}

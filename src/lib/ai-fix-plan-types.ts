export interface AiPriorityFix {
  title: string;
  why: string;
  action: string;
  impact: "high" | "medium" | "low";
}

export interface AiFixPlan {
  executiveSummary: string;
  projectedScoreNote: string;
  priorityFixes: AiPriorityFix[];
  llmsTxtDraft: string;
  nextSteps: string[];
}

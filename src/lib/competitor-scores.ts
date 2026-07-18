import type { AuditReport } from "@/lib/types";

export interface CompetitorAuditResult {
  label: string;
  url: string;
  report?: AuditReport;
  error?: string;
}

export function overallScore(report: AuditReport): number {
  const { seo, performance, accessibility, security, ai } = report.scores;
  const parts = [seo, performance, accessibility, security];
  if (typeof ai === "number") parts.push(ai);
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function checklistPassRate(report: AuditReport): number | null {
  const checklist = report.checklist;
  if (!checklist) return null;
  const pass = checklist.passCount ?? checklist.hasCount;
  const fail = checklist.failCount ?? checklist.missingCount;
  const attention = checklist.attentionCount ?? checklist.warningCount;
  const total = pass + fail + attention;
  if (total === 0) return null;
  return Math.round((pass / total) * 100);
}

export function rankCompetitorResults(results: CompetitorAuditResult[]): CompetitorAuditResult[] {
  return [...results].sort((a, b) => {
    if (a.report && b.report) return overallScore(b.report) - overallScore(a.report);
    if (a.report) return -1;
    if (b.report) return 1;
    return 0;
  });
}

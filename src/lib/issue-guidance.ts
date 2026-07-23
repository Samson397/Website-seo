import type { AuditCategory, AuditIssue, Severity } from "@/lib/types";

export type ImpactLevel = "high" | "medium" | "low";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type PriorityLabel = "Critical" | "High" | "Medium" | "Low";

/** Map internal severity → user-facing priority language. */
export function priorityFromSeverity(severity: Severity): PriorityLabel {
  if (severity === "critical") return "Critical";
  if (severity === "warning") return "High";
  return "Medium";
}

function impactFromSeverity(severity: Severity): ImpactLevel {
  if (severity === "critical") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

/**
 * Heuristic difficulty / time from category + severity.
 * Easy = copy/meta tweak; hard = infra or site-wide refactor.
 */
export function estimateFixEffort(
  category: AuditCategory,
  severity: Severity,
  title: string
): { difficulty: DifficultyLevel; timeEstimate: string } {
  const t = title.toLowerCase();

  if (
    /missing (title|meta description|h1|alt|canonical|lang)/i.test(t) ||
    /short (title|meta)/i.test(t) ||
    /generic link text/i.test(t) ||
    /twitter card/i.test(t) ||
    /og (title|description|image)/i.test(t)
  ) {
    return { difficulty: "easy", timeEstimate: "~10 min" };
  }

  if (
    /broken link|broken image|http [45]|unreachable/i.test(t) ||
    /duplicate (page titles|meta|h1)/i.test(t) ||
    /noindex|robots\.txt blocks/i.test(t)
  ) {
    return {
      difficulty: severity === "critical" ? "medium" : "easy",
      timeEstimate: severity === "critical" ? "~30–60 min" : "~15–30 min",
    };
  }

  if (category === "performance" || /pagespeed|lighthouse|core web|lcp|cls|unused/i.test(t)) {
    return { difficulty: "hard", timeEstimate: "~2–4 hrs" };
  }

  if (category === "security" || category === "domain") {
    return {
      difficulty: severity === "info" ? "medium" : "hard",
      timeEstimate: severity === "info" ? "~30–60 min" : "~1–3 hrs",
    };
  }

  if (category === "accessibility") {
    return { difficulty: "medium", timeEstimate: "~30–90 min" };
  }

  if (/orphan|depth|canonical coverage|site-wide|crawl/i.test(t)) {
    return { difficulty: "medium", timeEstimate: "~1–2 hrs" };
  }

  if (severity === "critical") return { difficulty: "medium", timeEstimate: "~45–90 min" };
  if (severity === "warning") return { difficulty: "medium", timeEstimate: "~20–45 min" };
  return { difficulty: "easy", timeEstimate: "~10–20 min" };
}

/** Fill impact / difficulty / time / priority when callers omit them. */
export function enrichIssueMeta(
  issue: Omit<AuditIssue, "id">
): Omit<AuditIssue, "id"> {
  const effort = estimateFixEffort(issue.category, issue.severity, issue.title);
  return {
    ...issue,
    impact: issue.impact ?? impactFromSeverity(issue.severity),
    difficulty: issue.difficulty ?? effort.difficulty,
    timeEstimate: issue.timeEstimate ?? effort.timeEstimate,
    priorityLabel: issue.priorityLabel ?? priorityFromSeverity(issue.severity),
  };
}

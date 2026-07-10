import type { AuditIssue, AuditReport, AuditCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  security: "Security",
  links: "Links",
  domain: "Domain",
};

const CATEGORIES: AuditCategory[] = [
  "seo",
  "performance",
  "accessibility",
  "security",
  "links",
  "domain",
];

export function actionableCount(report: AuditReport): number {
  return report.summary.critical + report.summary.warning;
}

export function groupIssuesByCategory(issues: AuditIssue[]): Record<AuditCategory, AuditIssue[]> {
  const groups = Object.fromEntries(CATEGORIES.map((c) => [c, [] as AuditIssue[]])) as Record<
    AuditCategory,
    AuditIssue[]
  >;
  for (const issue of issues) {
    groups[issue.category].push(issue);
  }
  return groups;
}

export function topActionableIssues(issues: AuditIssue[], limit = 5): AuditIssue[] {
  const order = { critical: 0, warning: 1, info: 2 };
  return [...issues]
    .filter((i) => i.severity !== "info")
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, limit);
}

export function categoryLabel(category: AuditCategory): string {
  return CATEGORY_LABELS[category];
}

export { CATEGORIES as ISSUE_CATEGORIES };

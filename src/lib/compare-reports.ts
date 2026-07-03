import type { AuditIssue, AuditReport, SiteChecklist } from "@/lib/types";

export function issueKey(issue: AuditIssue): string {
  return `${issue.category}::${issue.title}`;
}

function issueMap(issues: AuditIssue[]): Map<string, AuditIssue> {
  const map = new Map<string, AuditIssue>();
  for (const issue of issues) {
    map.set(issueKey(issue), issue);
  }
  return map;
}

export interface ChecklistComparison {
  improved: SiteChecklist["items"];
  regressed: SiteChecklist["items"];
  hasCountBefore: number;
  hasCountAfter: number;
  hasCountDelta: number;
}

export interface ReportComparison {
  fixed: AuditIssue[];
  newIssues: AuditIssue[];
  stillOpen: AuditIssue[];
  severityChanged: { issue: AuditIssue; from: AuditIssue["severity"]; to: AuditIssue["severity"] }[];
  checklist?: ChecklistComparison;
}

function compareChecklists(
  previous: SiteChecklist,
  current: SiteChecklist
): ChecklistComparison {
  const prevById = new Map(previous.items.map((i) => [i.id, i]));
  const currById = new Map(current.items.map((i) => [i.id, i]));
  const improved: SiteChecklist["items"] = [];
  const regressed: SiteChecklist["items"] = [];

  for (const [id, curr] of Array.from(currById.entries())) {
    const prev = prevById.get(id);
    if (!prev || prev.status === curr.status) continue;
    const rank = { missing: 0, warning: 1, has: 2 };
    if (rank[curr.status] > rank[prev.status]) improved.push(curr);
    else if (rank[curr.status] < rank[prev.status]) regressed.push(curr);
  }

  return {
    improved,
    regressed,
    hasCountBefore: previous.hasCount,
    hasCountAfter: current.hasCount,
    hasCountDelta: current.hasCount - previous.hasCount,
  };
}

export function compareReports(
  previous: AuditReport,
  current: AuditReport
): ReportComparison {
  const prevMap = issueMap(previous.issues);
  const currMap = issueMap(current.issues);

  const fixed: AuditIssue[] = [];
  const newIssues: AuditIssue[] = [];
  const stillOpen: AuditIssue[] = [];
  const severityChanged: ReportComparison["severityChanged"] = [];

  for (const [key, prevIssue] of Array.from(prevMap.entries())) {
    const currIssue = currMap.get(key);
    if (!currIssue) {
      fixed.push(prevIssue);
    } else if (currIssue.severity !== prevIssue.severity) {
      severityChanged.push({
        issue: currIssue,
        from: prevIssue.severity,
        to: currIssue.severity,
      });
      stillOpen.push(currIssue);
    } else {
      stillOpen.push(currIssue);
    }
  }

  for (const [key, currIssue] of Array.from(currMap.entries())) {
    if (!prevMap.has(key)) {
      newIssues.push(currIssue);
    }
  }

  const result: ReportComparison = { fixed, newIssues, stillOpen, severityChanged };

  if (previous.checklist && current.checklist) {
    result.checklist = compareChecklists(previous.checklist, current.checklist);
  }

  return result;
}

export function comparisonSummary(comparison: ReportComparison): string {
  const parts: string[] = [];
  if (comparison.fixed.length > 0) {
    parts.push(`${comparison.fixed.length} fixed`);
  }
  if (comparison.newIssues.length > 0) {
    parts.push(`${comparison.newIssues.length} new`);
  }
  if (comparison.checklist && comparison.checklist.hasCountDelta !== 0) {
    const delta = comparison.checklist.hasCountDelta;
    parts.push(`checklist ${delta > 0 ? "+" : ""}${delta}`);
  }
  return parts.length > 0 ? parts.join(", ") : "No issue changes";
}

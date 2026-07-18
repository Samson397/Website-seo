import type { AuditIssue } from "@/lib/types";

/** Collapse dynamic path segments into a template for grouping. */
export function pathToTemplate(pathname: string): string {
  const parts = (pathname || "/").split("/").filter(Boolean);
  if (parts.length === 0) return "/";

  const templated = parts.map((seg) => {
    if (/^\d+$/.test(seg)) return ":id";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) {
      return ":uuid";
    }
    if (/^[0-9a-f]{12,}$/i.test(seg)) return ":hash";
    if (seg.length > 24 && /[0-9]/.test(seg) && /[a-z]/i.test(seg)) return ":slug";
    return seg;
  });

  return `/${templated.join("/")}`;
}

export function extractPathFromIssue(issue: AuditIssue): string | null {
  if (issue.pagePath) return issue.pagePath;
  const candidates = [issue.currentValue, issue.description].filter(Boolean) as string[];
  for (const text of candidates) {
    // Prefer pathname-looking tokens
    const pathMatch = text.match(/(?:^|[\s,"'])(\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)/);
    if (pathMatch?.[1] && pathMatch[1].length > 1) return pathMatch[1].split(/[?\s]/)[0];
    try {
      if (text.startsWith("http")) {
        return new URL(text.split(/[\s,]/)[0]).pathname;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export interface IssueGroup {
  template: string;
  label: string;
  count: number;
  critical: number;
  warning: number;
  info: number;
  issues: AuditIssue[];
}

export function groupIssuesByUrlTemplate(issues: AuditIssue[]): IssueGroup[] {
  const map = new Map<string, AuditIssue[]>();

  for (const issue of issues) {
    const path = extractPathFromIssue(issue);
    const template = path ? pathToTemplate(path) : "(site-wide)";
    const list = map.get(template) || [];
    list.push(issue);
    map.set(template, list);
  }

  return Array.from(map.entries())
    .map(([template, groupIssues]) => ({
      template,
      label: template === "(site-wide)" ? "Site-wide / homepage" : template,
      count: groupIssues.length,
      critical: groupIssues.filter((i) => i.severity === "critical").length,
      warning: groupIssues.filter((i) => i.severity === "warning").length,
      info: groupIssues.filter((i) => i.severity === "info").length,
      issues: groupIssues,
    }))
    .sort((a, b) => {
      if (b.critical !== a.critical) return b.critical - a.critical;
      if (b.warning !== a.warning) return b.warning - a.warning;
      return b.count - a.count;
    });
}

"use client";

import { useMemo, useState } from "react";
import type { AuditIssue } from "@/lib/types";
import { groupIssuesByUrlTemplate } from "@/lib/issue-groups";

interface IssueGroupsPanelProps {
  issues: AuditIssue[];
}

export function IssueGroupsPanel({ issues }: IssueGroupsPanelProps) {
  const groups = useMemo(() => groupIssuesByUrlTemplate(issues), [issues]);
  const [open, setOpen] = useState<string | null>(groups[0]?.template ?? null);

  if (issues.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/5 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Grouping</p>
        <h3 className="font-display mt-1 text-xl font-semibold text-ink">Issues by URL pattern</h3>
        <p className="mt-2 text-sm text-ink-muted">
          Dynamic IDs collapse into templates (e.g. <code className="text-xs">/blog/:slug</code>) so
          you can fix whole sections at once.
        </p>
      </div>
      <ul className="divide-y divide-ink/5">
        {groups.map((g) => {
          const isOpen = open === g.template;
          return (
            <li key={g.template}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : g.template)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-paper sm:px-6"
              >
                <span className="font-mono text-sm text-ink">{g.label}</span>
                <span className="flex shrink-0 flex-wrap gap-2 text-xs">
                  {g.critical > 0 ? (
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                      {g.critical} critical
                    </span>
                  ) : null}
                  {g.warning > 0 ? (
                    <span className="rounded-md bg-amber-soft px-2 py-0.5 font-semibold text-amber-900">
                      {g.warning} warn
                    </span>
                  ) : null}
                  <span className="rounded-md bg-mist px-2 py-0.5 text-ink-muted">
                    {g.count} issue{g.count === 1 ? "" : "s"}
                  </span>
                </span>
              </button>
              {isOpen ? (
                <ul className="space-y-1 bg-paper/60 px-5 pb-4 sm:px-6">
                  {g.issues.slice(0, 12).map((issue) => (
                    <li key={issue.id} className="text-sm text-ink-muted">
                      <span
                        className={
                          issue.severity === "critical"
                            ? "font-medium text-rose-700"
                            : issue.severity === "warning"
                              ? "font-medium text-amber-800"
                              : "font-medium text-teal"
                        }
                      >
                        {issue.severity}
                      </span>
                      {" · "}
                      {issue.title}
                    </li>
                  ))}
                  {g.issues.length > 12 ? (
                    <li className="text-xs text-ink-muted">+{g.issues.length - 12} more</li>
                  ) : null}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

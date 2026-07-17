"use client";

import type { AuditReport, AuditCategory } from "@/lib/types";
import {
  actionableCount,
  categoryLabel,
  groupIssuesByCategory,
  ISSUE_CATEGORIES,
  topActionableIssues,
} from "@/lib/issue-summary";

interface ProblemsSummaryProps {
  report: AuditReport;
  onJumpToCategory?: (category: AuditCategory | "all") => void;
}

export function ProblemsSummary({ report, onJumpToCategory }: ProblemsSummaryProps) {
  const actionable = actionableCount(report);
  const total = report.issues.length;
  const topIssues = topActionableIssues(report.issues);
  const byCategory = groupIssuesByCategory(report.issues);
  const categoriesWithIssues = ISSUE_CATEGORIES.filter(
    (c) => byCategory[c].filter((i) => i.severity !== "info").length > 0
  );

  const allClear = actionable === 0;
  const overall = Math.round(
    (report.scores.seo +
      report.scores.performance +
      report.scores.accessibility +
      report.scores.security) /
      4
  );

  return (
    <section className="report-shell animate-rise overflow-hidden rounded-3xl">
      <div className="border-b border-ink/5 bg-gradient-to-r from-ink via-brand-deep to-brand px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
              Priority briefing
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {allClear ? "Nothing critical found" : "What’s wrong on this site"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              {allClear
                ? `We ran ${total} checks across SEO, security, speed, and accessibility. No critical or warning issues.`
                : `${actionable} issue${actionable === 1 ? "" : "s"} need attention — start with the ranked fixes below.`}
            </p>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Overall
              </p>
              <p className="font-display text-5xl font-semibold leading-none">{overall}</p>
            </div>
            <div className="flex flex-wrap gap-2 pb-1 text-xs font-semibold">
              {report.summary.critical > 0 && (
                <span className="rounded-lg bg-coral px-2.5 py-1 text-white">
                  {report.summary.critical} critical
                </span>
              )}
              {report.summary.warning > 0 && (
                <span className="rounded-lg bg-amber px-2.5 py-1 text-white">
                  {report.summary.warning} warnings
                </span>
              )}
              {report.summary.info > 0 && (
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-white">
                  {report.summary.info} info
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {categoriesWithIssues.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Problems by area
            </p>
            <div className="flex flex-wrap gap-2">
              {categoriesWithIssues.map((category) => {
                const count = byCategory[category].filter((i) => i.severity !== "info").length;
                const critical = byCategory[category].filter((i) => i.severity === "critical").length;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onJumpToCategory?.(category)}
                    className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                      critical > 0
                        ? "bg-coral-soft text-coral ring-1 ring-coral/20"
                        : "bg-mist text-ink hover:bg-brand-soft"
                    }`}
                  >
                    {categoryLabel(category)}
                    <span className="ml-1.5 opacity-70">{count}</span>
                  </button>
                );
              })}
              {onJumpToCategory && (
                <button
                  type="button"
                  onClick={() => onJumpToCategory("all")}
                  className="rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
                >
                  View all issues
                </button>
              )}
            </div>
          </div>
        )}

        {topIssues.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Fix these first
            </p>
            <ol className="space-y-3">
              {topIssues.map((issue, index) => (
                <li
                  key={issue.id}
                  className="flex gap-3 rounded-2xl border border-ink/5 bg-white px-4 py-3"
                >
                  <span className="font-display text-lg font-semibold text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          issue.severity === "critical"
                            ? "bg-coral-soft text-coral"
                            : "bg-amber-soft text-amber"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                        {categoryLabel(issue.category)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-ink">{issue.title}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

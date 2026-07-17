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

  return (
    <div
      className={`rounded-xl border-2 p-6 shadow-sm ${
        allClear
          ? "border-green-200 bg-green-50"
          : report.summary.critical > 0
            ? "border-red-200 bg-red-50/50"
            : "border-amber-200 bg-amber-50/50"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {allClear ? "Nothing critical found" : "What&apos;s wrong on this site"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {allClear
              ? `We ran ${total} checks across SEO, security, speed, and accessibility. No critical or warning issues.`
              : `${actionable} issue${actionable === 1 ? "" : "s"} need your attention across SEO, security, performance, and more.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {report.summary.critical > 0 && (
            <span className="rounded-full bg-red-600 px-3 py-1 font-semibold text-white">
              {report.summary.critical} critical
            </span>
          )}
          {report.summary.warning > 0 && (
            <span className="rounded-full bg-amber-500 px-3 py-1 font-semibold text-white">
              {report.summary.warning} warnings
            </span>
          )}
          {report.summary.info > 0 && (
            <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-700">
              {report.summary.info} info
            </span>
          )}
        </div>
      </div>

      {categoriesWithIssues.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:ring-2 hover:ring-blue-300 ${
                    critical > 0
                      ? "bg-red-100 text-red-800"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {categoryLabel(category)}
                  <span className="ml-1.5 font-bold">{count}</span>
                </button>
              );
            })}
            {onJumpToCategory && (
              <button
                type="button"
                onClick={() => onJumpToCategory("all")}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                View all issues
              </button>
            )}
          </div>
        </div>
      )}

      {topIssues.length > 0 && (
        <div className="mt-5 rounded-lg border border-slate-200/80 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fix these first
          </p>
          <ul className="space-y-2">
            {topIssues.map((issue) => (
              <li key={issue.id} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                    issue.severity === "critical"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {issue.severity}
                </span>
                <span className="text-slate-800">
                  <span className="font-medium">{issue.title}</span>
                  <span className="text-slate-500"> — {categoryLabel(issue.category)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.checklist && (report.checklist.failCount ?? report.checklist.missingCount) > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          Plus{" "}
          <span className="font-semibold text-rose-700">
            {report.checklist.failCount ?? report.checklist.missingCount} failed check
            {(report.checklist.failCount ?? report.checklist.missingCount) === 1 ? "" : "s"}
          </span>{" "}
          in the full scan results below.
        </p>
      )}
    </div>
  );
}

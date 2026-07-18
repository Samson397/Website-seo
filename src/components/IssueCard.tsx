"use client";

import { useState } from "react";
import type { AuditIssue } from "@/lib/types";

interface IssueCardProps {
  issue: AuditIssue;
  resolved?: boolean;
  onToggleResolved?: (id: string) => void;
  /** Optional AI plain-English rewrite for this issue */
  aiHint?: { plainEnglish: string; action: string };
}

const SEVERITY_STYLES = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  security: "Security",
  links: "Links",
  domain: "Domain",
};

export function IssueCard({ issue, resolved, onToggleResolved, aiHint }: IssueCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyFix() {
    if (!issue.fixSnippet) return;
    await navigator.clipboard.writeText(issue.fixSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`rounded-lg border bg-white p-5 shadow-sm transition ${
        resolved ? "border-green-200 opacity-60" : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {onToggleResolved && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={resolved}
              onChange={() => onToggleResolved(issue.id)}
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <span className={resolved ? "line-through" : ""}>Done</span>
          </label>
        )}
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${SEVERITY_STYLES[issue.severity]}`}
        >
          {issue.severity}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {CATEGORY_LABELS[issue.category] || issue.category}
        </span>
      </div>

      <h3 className={`text-lg font-semibold text-slate-900 ${resolved ? "line-through" : ""}`}>
        {issue.title}
      </h3>
      <p className="mt-2 text-sm text-slate-600">{issue.description}</p>

      {aiHint ? (
        <div className="mt-3 rounded-lg border border-teal/20 bg-teal-soft/40 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-teal">In plain English</p>
          <p className="mt-1 text-sm text-ink">{aiHint.plainEnglish}</p>
          <p className="mt-2 text-sm font-medium text-ink">{aiHint.action}</p>
        </div>
      ) : null}

      {issue.currentValue && (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
          <span className="font-medium text-slate-700">Current: </span>
          <span className="text-slate-600">{issue.currentValue}</span>
        </div>
      )}

      <p className="mt-3 text-sm">
        <span className="font-medium text-slate-700">Recommendation: </span>
        <span className="text-slate-600">{issue.recommendation}</span>
      </p>

      {issue.fixSnippet && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Fix snippet
            </span>
            <button
              onClick={copyFix}
              className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-700"
            >
              {copied ? "Copied!" : "Copy fix"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-green-400">
            <code>{issue.fixSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

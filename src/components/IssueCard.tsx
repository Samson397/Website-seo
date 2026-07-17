"use client";

import { useState } from "react";
import type { AuditIssue } from "@/lib/types";

interface IssueCardProps {
  issue: AuditIssue;
  resolved?: boolean;
  onToggleResolved?: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  security: "Security",
  links: "Links",
  domain: "Domain",
};

export function IssueCard({ issue, resolved, onToggleResolved }: IssueCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyFix() {
    if (!issue.fixSnippet) return;
    await navigator.clipboard.writeText(issue.fixSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const rail =
    issue.severity === "critical"
      ? "severity-rail-critical"
      : issue.severity === "warning"
        ? "severity-rail-warning"
        : "severity-rail-info";

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-white transition ${
        resolved ? "border-accent/20 opacity-60" : "border-ink/8 shadow-sm hover:border-brand/25"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${rail}`} />
      <div className="p-5 pl-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {onToggleResolved && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={resolved}
                onChange={() => onToggleResolved(issue.id)}
                className="h-4 w-4 rounded border-ink/20 text-accent focus:ring-brand"
              />
              <span className={resolved ? "line-through" : ""}>Done</span>
            </label>
          )}
          <span className="rounded-md bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
            {issue.severity}
          </span>
          <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
            {CATEGORY_LABELS[issue.category] || issue.category}
          </span>
        </div>

        <h3 className={`font-display text-lg font-semibold text-ink ${resolved ? "line-through" : ""}`}>
          {issue.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{issue.description}</p>

        {issue.currentValue && (
          <p className="mt-3 rounded-xl bg-paper px-3 py-2 font-mono text-xs text-ink-soft">
            Current: {issue.currentValue}
          </p>
        )}

        <div className="mt-4 rounded-xl border border-brand/15 bg-brand-soft/40 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Recommendation</p>
          <p className="mt-1 text-sm text-ink">{issue.recommendation}</p>
        </div>

        {issue.fixSnippet && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Fix snippet
              </p>
              <button
                type="button"
                onClick={() => void copyFix()}
                className="text-xs font-semibold text-brand hover:text-brand-deep"
              >
                {copied ? "Copied" : "Copy fix"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-ink px-3 py-3 text-xs text-brand-bright">
              <code>{issue.fixSnippet}</code>
            </pre>
          </div>
        )}
      </div>
    </article>
  );
}

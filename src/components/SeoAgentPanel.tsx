"use client";

import { useMemo } from "react";
import type { AuditReport } from "@/lib/types";
import { buildSeoOpportunities, type SeoOpportunity } from "@/lib/seo-opportunities";

interface SeoAgentPanelProps {
  report: AuditReport;
  onJumpToIssues?: () => void;
}

const IMPACT_STYLE: Record<SeoOpportunity["impact"], string> = {
  high: "bg-rose-50 text-rose-800 ring-rose-200",
  medium: "bg-amber-50 text-amber-900 ring-amber-200",
  low: "bg-teal-soft text-teal ring-teal/30",
};

export function SeoAgentPanel({ report, onJumpToIssues }: SeoAgentPanelProps) {
  const opportunities = useMemo(() => buildSeoOpportunities(report), [report]);

  if (opportunities.length === 0) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white px-5 py-5 shadow-sm sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">SEOHub AI</p>
        <h3 className="font-display mt-1 text-xl font-semibold text-ink">No urgent opportunities</h3>
        <p className="mt-2 text-sm text-ink-muted">
          This scan looks healthy. Re-scan after content changes or compare competitors for gaps.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/5 bg-gradient-to-br from-mist to-white px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">SEOHub AI</p>
        <h3 className="font-display mt-1 text-xl font-semibold text-ink sm:text-2xl">
          I found {opportunities.length} opportunities
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Prioritized next actions from your audit — fix high-impact items first. No Google login required.
        </p>
      </div>

      <ol className="divide-y divide-ink/5">
        {opportunities.map((item, index) => (
          <li key={item.id} className="px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  <span className="mr-2 text-ink-muted">{index + 1}.</span>
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{item.why}</p>
                <p className="mt-2 text-sm text-ink">
                  <span className="font-medium">Do this:</span> {item.action}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${IMPACT_STYLE[item.impact]}`}
              >
                Impact: {item.impact}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {onJumpToIssues ? (
        <div className="border-t border-ink/5 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onJumpToIssues}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            Open matching issues
          </button>
        </div>
      ) : null}
    </section>
  );
}

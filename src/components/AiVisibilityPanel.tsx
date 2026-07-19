"use client";

import type { AiVisibilitySummary } from "@/lib/types";
import { formatTenLabel } from "@/lib/score-display";

interface AiVisibilityPanelProps {
  ai: AiVisibilitySummary;
}

export function AiVisibilityPanel({ ai }: AiVisibilityPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/5 bg-gradient-to-br from-ink to-ink-soft px-5 py-5 text-white sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-bright">
          AI visibility
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold sm:text-2xl">
              GEO readiness for AI search
            </h3>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Checks crawler access, structure, and brand signals that help ChatGPT, Perplexity,
              Claude, and Google AI discover and cite your site — not a live citation check.
            </p>
          </div>
          <p className="font-display text-4xl font-semibold tabular-nums">
            {formatTenLabel(ai.score)}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-ink/5">
        {ai.signals.map((s) => (
          <li key={s.id} className="flex gap-3 px-5 py-3.5 sm:px-6">
            <span
              className={`mt-0.5 inline-flex h-6 shrink-0 items-center rounded-md px-2 text-[11px] font-bold uppercase tracking-wide ${
                s.status === "pass"
                  ? "bg-teal-soft text-teal"
                  : s.status === "fail"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-soft text-amber-900"
              }`}
            >
              {s.status === "pass" ? "Pass" : s.status === "fail" ? "Fail" : "Review"}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{s.label}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{s.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      {(ai.botsBlocked.length > 0 || ai.botsAllowed.length > 0) && (
        <div className="border-t border-ink/5 px-5 py-4 text-xs text-ink-muted sm:px-6">
          {ai.botsBlocked.length > 0 ? (
            <p>
              <span className="font-semibold text-rose-700">Blocked bots:</span>{" "}
              {ai.botsBlocked.join(", ")}
            </p>
          ) : (
            <p>
              <span className="font-semibold text-teal">Major AI bots:</span> not blanket-blocked
            </p>
          )}
        </div>
      )}
    </div>
  );
}

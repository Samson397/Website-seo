"use client";

import type { HealthPillar } from "@/lib/health-pillars";

interface HealthPillarsPanelProps {
  pillars: HealthPillar[];
}

const STATUS_STYLES = {
  strong: "bg-teal-soft text-teal",
  ok: "bg-amber-soft text-amber-900",
  weak: "bg-rose-100 text-rose-800",
};

export function HealthPillarsPanel({ pillars }: HealthPillarsPanelProps) {
  if (!pillars.length) return null;

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
        SEO health
      </p>
      <h3 className="font-display mt-1 text-xl font-semibold text-ink">
        Where to focus next
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Eight pillars derived from your scores and checklist — not a single opaque number.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.id}
            className="rounded-xl border border-ink/8 bg-paper/80 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{pillar.label}</p>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[pillar.status]}`}
              >
                {pillar.status}
              </span>
            </div>
            <p className="font-display mt-2 text-2xl font-semibold tabular-nums text-ink">
              {pillar.score}
              <span className="text-sm font-medium text-ink-muted">/100</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div
                className={`h-full rounded-full ${
                  pillar.status === "strong"
                    ? "bg-teal"
                    : pillar.status === "ok"
                      ? "bg-amber"
                      : "bg-rose-500"
                }`}
                style={{ width: `${pillar.score}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-muted">{pillar.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

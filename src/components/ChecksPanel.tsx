"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GUIDES } from "@/lib/guides";
import { routes } from "@/lib/routes";
import type { CheckCategory, SiteChecklist } from "@/lib/types";

function guideForCheck(checkId: string) {
  const id = checkId.toLowerCase();
  return GUIDES.find((g) =>
    (g.relatedCheckIds || []).some((related) => id.includes(related) || related.includes(id))
  );
}

interface ChecksPanelProps {
  checklist: SiteChecklist;
}

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  seo: "SEO",
  content: "Content",
  technical: "Technical",
  social: "Social & sharing",
  security: "Security",
  accessibility: "Accessibility",
  trust: "Trust & domain",
  performance: "Performance",
};

const CATEGORY_ORDER: CheckCategory[] = [
  "seo",
  "content",
  "technical",
  "social",
  "security",
  "accessibility",
  "trust",
  "performance",
];

type Filter = "all" | "fail" | "attention" | "pass";

function statusStyles(status: "pass" | "fail" | "attention") {
  if (status === "pass") {
    return {
      badge: "bg-accent-soft text-accent",
      label: "Pass",
      dot: "bg-accent",
    };
  }
  if (status === "fail") {
    return {
      badge: "bg-coral-soft text-coral",
      label: "Fail",
      dot: "bg-coral",
    };
  }
  return {
    badge: "bg-amber-soft text-amber",
    label: "Review",
    dot: "bg-amber",
  };
}

/** Full scan results — categorized checks instead of have / don't-have lists. */
export function ChecksPanel({ checklist }: ChecksPanelProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    const normalized = checklist.items.map((i) => ({
      ...i,
      status: i.status,
      category: (i.category || "seo") as CheckCategory,
    }));
    if (filter === "all") return normalized;
    return normalized.filter((i) => i.status === filter);
  }, [checklist.items, filter]);

  const grouped = useMemo(() => {
    const map = new Map<CheckCategory, typeof items>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const item of items) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      items: map.get(cat) || [],
    })).filter((g) => g.items.length > 0);
  }, [items]);

  const passCount = checklist.passCount ?? checklist.hasCount;
  const failCount = checklist.failCount ?? checklist.missingCount;
  const attentionCount = checklist.attentionCount ?? checklist.warningCount;
  const total = checklist.items.length;

  return (
    <section className="report-shell animate-rise overflow-hidden rounded-3xl bg-white">
      <div className="border-b border-ink/5 bg-gradient-to-br from-ink via-brand-deep to-brand px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-bright">
          Full scan results
        </p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {total}+ checks across your site
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">{checklist.summary}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
          <Stat label="Passed" value={passCount} tone="pass" />
          <Stat label="Failed" value={failCount} tone="fail" />
          <Stat label="Review" value={attentionCount} tone="attention" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-ink/5 px-5 py-3 sm:px-7">
        {(
          [
            ["all", "All checks"],
            ["fail", "Failed"],
            ["attention", "Needs review"],
            ["pass", "Passed"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === key
                ? "bg-ink text-white"
                : "bg-mist text-ink-muted hover:bg-ink/10 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-ink/5">
        {grouped.map((group) => (
          <div key={group.category} className="px-5 py-5 sm:px-7">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
              {CATEGORY_LABELS[group.category]}
              <span className="ml-2 font-normal normal-case tracking-normal text-ink/40">
                {group.items.length}
              </span>
            </h3>
            <ul className="space-y-2">
              {group.items.map((check) => {
                const styles = statusStyles(check.status);
                return (
                  <li
                    key={check.id}
                    className="flex gap-3 rounded-xl px-3 py-3 transition hover:bg-paper sm:items-start"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{check.label}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles.badge}`}
                        >
                          {styles.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">{check.explanation}</p>
                      {check.fixHint && check.status !== "pass" && (
                        <p className="mt-1.5 text-sm text-teal">
                          <span className="font-medium">Fix: </span>
                          {check.fixHint}
                        </p>
                      )}
                      {check.status !== "pass" &&
                        (() => {
                          const guide = guideForCheck(check.id);
                          if (!guide) return null;
                          return (
                            <Link
                              href={`${routes.guides}/${guide.slug}`}
                              className="mt-1.5 inline-block text-xs font-semibold text-ink underline decoration-teal/40 underline-offset-2 hover:text-teal"
                            >
                              Read guide: {guide.title}
                            </Link>
                          );
                        })()}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {grouped.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-muted sm:px-7">
            No checks in this filter.
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "pass" | "fail" | "attention";
}) {
  const color =
    tone === "pass" ? "text-teal-bright" : tone === "fail" ? "text-rose-300" : "text-amber-300";
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <div className={`text-xl font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-white/55">{label}</div>
    </div>
  );
}

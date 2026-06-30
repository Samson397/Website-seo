"use client";

import type { SiteChecklist } from "@/lib/types";

interface SiteChecklistPanelProps {
  checklist: SiteChecklist;
}

export function SiteChecklistPanel({ checklist }: SiteChecklistPanelProps) {
  const missing = checklist.items.filter((i) => i.status === "missing");
  const warnings = checklist.items.filter((i) => i.status === "warning");
  const has = checklist.items.filter((i) => i.status === "has");

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 rounded-t-xl">
        <h2 className="text-xl font-bold text-slate-900">What Your Website Has &amp; What&apos;s Missing</h2>
        <p className="mt-2 text-base text-slate-700">{checklist.summary}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
            ✓ {checklist.hasCount} you have
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
            ✗ {checklist.missingCount} missing
          </span>
          {checklist.warningCount > 0 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
              ! {checklist.warningCount} needs attention
            </span>
          )}
        </div>
      </div>

      {missing.length > 0 && (
        <section className="border-b border-slate-100 px-5 py-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">✗</span>
            Missing — you should add these
          </h3>
          <ul className="space-y-3">
            {missing.map((i) => (
              <ChecklistRow key={i.id} item={i} />
            ))}
          </ul>
        </section>
      )}

      {warnings.length > 0 && (
        <section className="border-b border-slate-100 px-5 py-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-yellow-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">!</span>
            Needs attention
          </h3>
          <ul className="space-y-3">
            {warnings.map((i) => (
              <ChecklistRow key={i.id} item={i} />
            ))}
          </ul>
        </section>
      )}

      {has.length > 0 && (
        <section className="px-5 py-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-green-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">✓</span>
            You already have these
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {has.map((i) => (
              <li
                key={i.id}
                className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900"
              >
                <span className="mt-0.5 text-green-600">✓</span>
                <div>
                  <span className="font-medium">{i.label}</span>
                  <p className="text-xs text-green-700">{i.explanation}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ChecklistRow({
  item,
}: {
  item: SiteChecklist["items"][0];
}) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{item.label}</div>
      <p className="mt-1 text-sm text-slate-600">{item.explanation}</p>
      {item.fixHint && (
        <p className="mt-2 text-sm text-blue-700">
          <span className="font-medium">What to do: </span>
          {item.fixHint}
        </p>
      )}
    </li>
  );
}

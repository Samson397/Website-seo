"use client";

import { useState } from "react";
import type { AuditReport, AuditScores } from "@/lib/types";
import { compareReports } from "@/lib/compare-reports";

interface ScanComparisonPanelProps {
  previous: AuditReport;
  current: AuditReport;
}

function ScoreDelta({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  const color =
    delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-slate-500";
  const sign = delta > 0 ? "+" : "";

  return (
    <div className="rounded-lg bg-white/80 px-4 py-3 text-center">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="text-sm text-slate-400">{before}</span>
        <span className="text-slate-300">→</span>
        <span className="text-lg font-bold text-slate-900">{after}</span>
        <span className={`text-sm font-semibold ${color}`}>
          ({sign}{delta})
        </span>
      </div>
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: { title: string; severity: string }[];
  tone: "green" | "red" | "amber";
}) {
  const [expanded, setExpanded] = useState(tone !== "amber");

  if (issues.length === 0) return null;

  const colors = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-red-200 bg-red-50 text-red-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left font-semibold"
      >
        <span>
          {title} ({issues.length})
        </span>
        <span className="text-sm font-normal opacity-70">{expanded ? "Hide" : "Show"}</span>
      </button>
      {expanded && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {issues.map((issue) => (
            <li key={issue.title} className="flex items-start gap-2">
              <span className="opacity-60">•</span>
              <span>{issue.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ScanComparisonPanel({ previous, current }: ScanComparisonPanelProps) {
  const comparison = compareReports(previous, current);
  const categories: { key: keyof AuditScores; label: string }[] = [
    { key: "seo", label: "SEO" },
    { key: "performance", label: "Performance" },
    { key: "accessibility", label: "Accessibility" },
    { key: "security", label: "Security" },
  ];

  const criticalDelta = current.summary.critical - previous.summary.critical;
  const warningDelta = current.summary.warning - previous.summary.warning;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
      <h3 className="font-semibold text-blue-900">Scan comparison</h3>
      <p className="mt-1 text-sm text-blue-700">
        Compared to scan at {new Date(previous.scannedAt).toLocaleString()}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map(({ key, label }) => (
          <ScoreDelta
            key={key}
            label={label}
            before={previous.scores[key]}
            after={current.scores[key]}
          />
        ))}
      </div>

      <p className="mt-3 text-sm text-blue-800">
        Critical: {previous.summary.critical} → {current.summary.critical}
        {criticalDelta !== 0 && (
          <span className={criticalDelta < 0 ? " font-semibold text-emerald-700" : " font-semibold text-red-700"}>
            {" "}({criticalDelta > 0 ? "+" : ""}{criticalDelta})
          </span>
        )}
        {" · "}
        Warnings: {previous.summary.warning} → {current.summary.warning}
        {warningDelta !== 0 && (
          <span className={warningDelta < 0 ? " font-semibold text-emerald-700" : " font-semibold text-amber-700"}>
            {" "}({warningDelta > 0 ? "+" : ""}{warningDelta})
          </span>
        )}
      </p>

      {comparison.checklist && (
        <p className="mt-2 text-sm text-blue-800">
          Checklist: {comparison.checklist.hasCountBefore} → {comparison.checklist.hasCountAfter} passing
          {comparison.checklist.hasCountDelta !== 0 && (
            <span className={comparison.checklist.hasCountDelta > 0 ? " font-semibold text-emerald-700" : " font-semibold text-red-700"}>
              {" "}({comparison.checklist.hasCountDelta > 0 ? "+" : ""}{comparison.checklist.hasCountDelta})
            </span>
          )}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <IssueList title="Fixed" issues={comparison.fixed} tone="green" />
        <IssueList title="New issues" issues={comparison.newIssues} tone="red" />
        {comparison.severityChanged.length > 0 && (
          <IssueList
            title="Changed severity"
            issues={comparison.severityChanged.map(({ issue, from, to }) => ({
              title: `${issue.title} (${from} → ${to})`,
              severity: issue.severity,
            }))}
            tone="amber"
          />
        )}
        <IssueList title="Still open" issues={comparison.stillOpen} tone="amber" />
      </div>

      {comparison.checklist && comparison.checklist.improved.length > 0 && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-white/70 p-3 text-sm text-emerald-900">
          <p className="font-medium">Checklist improved</p>
          <ul className="mt-1 space-y-0.5">
            {comparison.checklist.improved.map((item) => (
              <li key={item.id}>✓ {item.label}</li>
            ))}
          </ul>
        </div>
      )}

      {comparison.checklist && comparison.checklist.regressed.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-white/70 p-3 text-sm text-red-900">
          <p className="font-medium">Checklist regressed</p>
          <ul className="mt-1 space-y-0.5">
            {comparison.checklist.regressed.map((item) => (
              <li key={item.id}>✗ {item.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

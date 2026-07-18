"use client";

import type { AuditReport } from "@/lib/types";
import { formatTen, formatTenLabel, overallFromScores } from "@/lib/score-display";

/** Static reference averages (0–100) — does not expose your private scan network. */
const REFERENCE = {
  avgOverall: 68,
  avgSeo: 70,
  avgPerformance: 65,
  avgAccessibility: 72,
  avgSecurity: 64,
  avgAi: 55,
};

interface BenchmarkCompareProps {
  report: AuditReport;
}

export function BenchmarkCompare({ report }: BenchmarkCompareProps) {
  const overall = overallFromScores(report.scores);
  const delta = overall - REFERENCE.avgOverall;

  return (
    <section className="rounded-2xl border border-ink/10 bg-gradient-to-br from-ink to-ink-soft px-5 py-5 text-white sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-bright">
        Score snapshot · out of 10
      </p>
      <h3 className="font-display mt-2 text-xl font-semibold">
        Your score {formatTenLabel(overall)} vs typical ~{formatTenLabel(REFERENCE.avgOverall)}
      </h3>
      <p className="mt-2 text-sm text-white/70">
        {delta >= 0
          ? "You're ahead of a typical site baseline on the /10 scale."
          : "You're below a typical site baseline — fix failed checks and re-scan."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Mini label="SEO" you={report.scores.seo} avg={REFERENCE.avgSeo} />
        <Mini label="Speed" you={report.scores.performance} avg={REFERENCE.avgPerformance} />
        <Mini label="A11y" you={report.scores.accessibility} avg={REFERENCE.avgAccessibility} />
        <Mini label="Security" you={report.scores.security} avg={REFERENCE.avgSecurity} />
        <Mini label="AI" you={report.scores.ai ?? 0} avg={REFERENCE.avgAi} />
      </div>
    </section>
  );
}

function Mini({ label, you, avg }: { label: string; you: number; avg: number }) {
  const up = you >= avg;
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <p className="text-[10px] uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">
        {formatTen(you)}
        <span className="text-[10px] opacity-60">/10</span>{" "}
        <span className={`text-xs font-medium ${up ? "text-brand-bright" : "text-amber-300"}`}>
          {up ? "▲" : "▼"} ~{formatTen(avg)}
        </span>
      </p>
    </div>
  );
}

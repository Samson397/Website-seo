"use client";

import { formatUrlDisplay } from "@/lib/url-display";
import { ScoreGauge } from "@/components/ScoreGauge";
import { UnlockFullScan } from "@/components/UnlockFullScan";
import { SerpPreview } from "@/components/SerpPreview";
import { AiVisibilityPanel } from "@/components/AiVisibilityPanel";
import { categoryLabel } from "@/lib/issue-summary";
import { formatTenLabel, overallFromScores } from "@/lib/score-display";
import type { AuditReport } from "@/lib/types";

interface FreePreviewReportProps {
  report: AuditReport;
  onRescan?: () => void;
  rescanLoading?: boolean;
}

/** Limited free teaser — scores + locked issue titles. Full detail requires unlock. */
export function FreePreviewReport({ report, onRescan, rescanLoading }: FreePreviewReportProps) {
  const overall = overallFromScores(report.scores);
  const lockedIssues = Math.max(0, report.summary.critical + report.summary.warning + report.summary.info - report.issues.length);
  const checklist = report.checklist;

  return (
    <div className="space-y-8">
      <UnlockFullScan url={report.url} />

      <section className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/5 bg-gradient-to-br from-ink to-ink-soft px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
                Free preview
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {formatUrlDisplay(report.url)}
              </h2>
              <p className="mt-2 text-sm text-white/65">
                Homepage score only · Scanned {new Date(report.scannedAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Overall /10
              </p>
              <p className="font-display text-5xl font-semibold leading-none tabular-nums">
                {formatTenLabel(overall)}
              </p>
            </div>
          </div>
          {onRescan ? (
            <button
              type="button"
              onClick={onRescan}
              disabled={rescanLoading}
              className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 disabled:opacity-60"
            >
              {rescanLoading ? "Re-scanning…" : "Re-scan homepage"}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-6 px-6 py-7 sm:grid-cols-3 lg:grid-cols-5 sm:px-8">
          <ScoreGauge label="SEO" score={report.scores.seo} />
          <ScoreGauge label="Performance" score={report.scores.performance} />
          <ScoreGauge label="Accessibility" score={report.scores.accessibility} />
          <ScoreGauge label="Security" score={report.scores.security} />
          <ScoreGauge label="AI visibility" score={report.scores.ai ?? 0} />
        </div>
      </section>

      {report.aiVisibility ? <AiVisibilityPanel ai={report.aiVisibility} /> : null}

      {report.serpPreview ? (
        <SerpPreview
          title={report.serpPreview.title}
          description={report.serpPreview.description}
          url={report.serpPreview.url}
        />
      ) : null}

      <section className="rounded-3xl border border-ink/10 bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Issues found</p>
            <h3 className="font-display mt-1 text-xl font-semibold text-ink">
              {report.summary.critical + report.summary.warning} need attention
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-rose-700">
              {report.summary.critical} critical
            </span>
            <span className="rounded-lg bg-amber-soft px-2.5 py-1 text-amber-900">
              {report.summary.warning} warnings
            </span>
            <span className="rounded-lg bg-mist px-2.5 py-1 text-ink-muted">
              {report.summary.info} info
            </span>
          </div>
        </div>

        <ul className="mt-5 space-y-3">
          {report.issues.map((issue, index) => (
            <li
              key={issue.id}
              className="relative overflow-hidden rounded-2xl border border-ink/8 bg-paper/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                    {String(index + 1).padStart(2, "0")} · {issue.severity} ·{" "}
                    {categoryLabel(issue.category)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{issue.title}</p>
                </div>
                <span className="shrink-0 rounded-md bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Locked
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted blur-[1.5px] select-none">
                Detailed diagnosis, current values, and fix steps are available after unlock.
              </p>
            </li>
          ))}
        </ul>

        {lockedIssues > 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Plus{" "}
            <span className="font-semibold text-ink">{lockedIssues} more issues</span> hidden in the
            free preview.
          </p>
        ) : null}
      </section>

      {checklist ? (
        <section className="rounded-3xl border border-dashed border-brand/30 bg-brand-soft/40 px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Checklist</p>
          <h3 className="font-display mt-1 text-xl font-semibold text-ink">Locked behind unlock</h3>
          <p className="mt-2 text-sm text-ink-muted">{checklist.summary}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Passed" value={checklist.passCount} />
            <Stat label="Failed" value={checklist.failCount} />
            <Stat label="Review" value={checklist.attentionCount} />
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-ink/10 bg-ink px-6 py-6 text-white sm:px-8">
        <h3 className="font-display text-2xl font-semibold tracking-tight">
          Unlock the rest of the report
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-white/75">
          <li>✓ Full issue details, recommendations, and fix snippets</li>
          <li>✓ Complete Pass / Fail / Review checklist</li>
          <li>✓ Full-site crawl up to 200 pages + site-wide issues</li>
          <li>✓ Domain / DNS / SSL overview, exports, email, and share link</li>
        </ul>
        <div className="mt-5">
          <UnlockFullScan url={report.url} variant="inline" />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
    </div>
  );
}

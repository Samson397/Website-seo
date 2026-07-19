"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatUrlDisplay } from "@/lib/url-display";
import { ScoreGauge } from "@/components/ScoreGauge";
import { AiVisibilityPanel } from "@/components/AiVisibilityPanel";
import { ProblemsSummary } from "@/components/ProblemsSummary";
import { ChecksPanel } from "@/components/ChecksPanel";
import { AuditReportView } from "@/components/AuditReport";
import { BenchmarkCompare } from "@/components/BenchmarkCompare";
import { WatchToggle } from "@/components/WatchToggle";
import { AiFixPlanPanel } from "@/components/AiFixPlanPanel";
import { formatTenLabel, overallFromScores } from "@/lib/score-display";
import { routes } from "@/lib/routes";
import type { AiFixPlan } from "@/lib/ai-fix-plan-types";
import type { AuditCategory, AuditReport } from "@/lib/types";

type Tab = "brief" | "issues" | "checklist" | "details";

interface FullAuditDeliveryProps {
  report: AuditReport;
  previousReport?: AuditReport | null;
  onRescan?: () => void;
  rescanLoading?: boolean;
  expandingCrawl?: boolean;
}

/** Score-first full report: brief → issues → checklist → full detail. */
export function FullAuditDelivery({
  report,
  previousReport,
  onRescan,
  rescanLoading,
  expandingCrawl,
}: FullAuditDeliveryProps) {
  const [tab, setTab] = useState<Tab>("brief");
  const [issueFilter, setIssueFilter] = useState<AuditCategory | "all">("all");
  const [aiPlan, setAiPlan] = useState<AiFixPlan | null>(null);
  const overall = overallFromScores(report.scores);
  const shareHref = report.shareId ? `/r/${report.shareId}` : null;
  const aiIssueHints = useMemo(() => {
    if (!aiPlan?.issueRewrites?.length) return undefined;
    const map: Record<string, { plainEnglish: string; action: string }> = {};
    for (const item of aiPlan.issueRewrites) {
      if (item.issueId) map[item.issueId] = { plainEnglish: item.plainEnglish, action: item.action };
    }
    return map;
  }, [aiPlan]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/5 bg-gradient-to-br from-ink to-ink-soft px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
                Full SEO unlocked
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {formatUrlDisplay(report.url)}
              </h2>
              <p className="mt-2 text-sm text-white/65">
                {report.crawl
                  ? `Site crawl · ${report.crawl.pagesScanned} pages · `
                  : "Homepage report · "}
                Scanned {new Date(report.scannedAt).toLocaleString()}
              </p>
              {expandingCrawl ? (
                <p className="mt-2 text-sm font-medium text-brand-bright">
                  Expanding to full-site crawl…
                </p>
              ) : null}
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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {shareHref ? (
              <Link
                href={shareHref}
                className="rounded-xl bg-brand-bright px-4 py-2 text-sm font-semibold text-ink hover:bg-white"
              >
                Open shareable report
              </Link>
            ) : null}
            {onRescan ? (
              <button
                type="button"
                onClick={onRescan}
                disabled={rescanLoading || expandingCrawl}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 disabled:opacity-60"
              >
                {rescanLoading || expandingCrawl ? "Scanning…" : "Re-scan site"}
              </button>
            ) : null}
            <WatchToggle report={report} />
            <Link href={routes.history} className="text-sm text-white/70 hover:text-white">
              History
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 px-6 py-7 sm:grid-cols-3 lg:grid-cols-5 sm:px-8">
          <ScoreGauge label="SEO" score={report.scores.seo} />
          <ScoreGauge label="Performance" score={report.scores.performance} />
          <ScoreGauge label="Accessibility" score={report.scores.accessibility} />
          <ScoreGauge label="Security" score={report.scores.security} />
          <ScoreGauge label="AI visibility" score={report.scores.ai ?? 0} />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-ink/10 pb-1">
        {(
          [
            ["brief", "Brief"],
            ["issues", "Issues"],
            ["checklist", "Checklist"],
            ["details", "Full detail"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === id ? "bg-ink text-white" : "text-ink-muted hover:bg-mist hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "brief" ? (
        <div className="space-y-8">
          <AiFixPlanPanel report={report} auto onPlan={setAiPlan} />
          {report.aiVisibility ? <AiVisibilityPanel ai={report.aiVisibility} /> : null}
          <ProblemsSummary
            report={report}
            onJumpToCategory={(category) => {
              setIssueFilter(category);
              setTab("issues");
            }}
          />
          <BenchmarkCompare report={report} />
          {shareHref ? (
            <section className="rounded-2xl border border-teal/25 bg-teal-soft/40 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                Deliverable
              </p>
              <h3 className="font-display mt-1 text-xl font-semibold text-ink">
                Share this report
              </h3>
              <p className="mt-2 text-sm text-ink-muted">
                Send a clean link — scores, fixes, and crawl summary without needing an account.
              </p>
              <Link
                href={shareHref}
                className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
              >
                View shareable report
              </Link>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "issues" ? (
        <div id="audit-issues">
          <AuditReportView
            report={report}
            previousReport={previousReport}
            onRescan={onRescan}
            rescanLoading={rescanLoading}
            showProblemsSummary
            categoryFilter={issueFilter}
            onCategoryFilterChange={setIssueFilter}
            aiIssueHints={aiIssueHints}
          />
        </div>
      ) : null}

      {tab === "checklist" ? (
        report.checklist ? (
          <ChecksPanel checklist={report.checklist} />
        ) : (
          <p className="text-sm text-ink-muted">Checklist not available for this scan.</p>
        )
      ) : null}

      {tab === "details" ? (
        <AuditReportView
          report={report}
          previousReport={previousReport}
          onRescan={onRescan}
          rescanLoading={rescanLoading}
          showProblemsSummary={false}
          categoryFilter={issueFilter}
          onCategoryFilterChange={setIssueFilter}
          aiIssueHints={aiIssueHints}
        />
      ) : null}
    </div>
  );
}

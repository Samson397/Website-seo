"use client";

import { useState, useEffect, useCallback } from "react";
import type { AuditReport, AuditCategory } from "@/lib/types";
import { formatUrlDisplay } from "@/lib/url-display";
import { ProblemsSummary } from "@/components/ProblemsSummary";
import { ScoreGauge } from "@/components/ScoreGauge";
import { IssueCard } from "@/components/IssueCard";
import { SerpPreview } from "@/components/SerpPreview";
import { ScanComparisonPanel } from "@/components/ScanComparisonPanel";
import { ExportButtons } from "@/components/ExportButtons";
import { EmailReportButton } from "@/components/EmailReportButton";
import { ShareReportButton } from "@/components/ShareReportButton";
import { SiteCrawlPanel } from "@/components/SiteCrawlPanel";
import { SiteOverviewPanel } from "@/components/SiteOverviewPanel";
import { IssueGroupsPanel } from "@/components/IssueGroupsPanel";
import { AiVisibilityPanel } from "@/components/AiVisibilityPanel";
import type { AiFixPlan } from "@/lib/ai-fix-plan-types";
import { formatTenLabel, overallFromScores } from "@/lib/score-display";

interface AuditReportViewProps {
  report: AuditReport;
  previousReport?: AuditReport | null;
  onRescan?: () => void;
  rescanLoading?: boolean;
  showProblemsSummary?: boolean;
  categoryFilter?: AuditCategory | "all";
  onCategoryFilterChange?: (category: AuditCategory | "all") => void;
  /** AI plain-English hints keyed by issue id */
  aiIssueHints?: Record<string, { plainEnglish: string; action: string }>;
  /** Optional AI brief included in PDF / email exports */
  aiPlan?: AiFixPlan | null;
}

const CATEGORIES: { key: AuditCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "seo", label: "SEO" },
  { key: "performance", label: "Performance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "security", label: "Security" },
  { key: "links", label: "Links" },
  { key: "domain", label: "Domain" },
];

function storageKey(url: string) {
  return `audit-resolved-${url}`;
}

export function AuditReportView({
  report,
  previousReport,
  onRescan,
  rescanLoading,
  showProblemsSummary = true,
  categoryFilter: controlledFilter,
  onCategoryFilterChange,
  aiIssueHints,
  aiPlan,
}: AuditReportViewProps) {
  const [internalFilter, setInternalFilter] = useState<AuditCategory | "all">("all");
  const filter = controlledFilter ?? internalFilter;
  const setFilter = onCategoryFilterChange ?? setInternalFilter;
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [hideResolved, setHideResolved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(report.url));
      if (stored) setResolved(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }
  }, [report.url]);

  const toggleResolved = useCallback(
    (id: string) => {
      setResolved((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem(storageKey(report.url), JSON.stringify(Array.from(next)));
        return next;
      });
    },
    [report.url]
  );

  const filteredIssues = report.issues.filter((i) => {
    if (filter !== "all" && i.category !== filter) return false;
    if (hideResolved && resolved.has(i.id)) return false;
    return true;
  });

  const resolvedCount = report.issues.filter((i) => resolved.has(i.id)).length;

  return (
    <div className="mt-10 space-y-8">
      {showProblemsSummary && (
        <ProblemsSummary
          report={report}
          onJumpToCategory={(category) => {
            setFilter(category);
            document.getElementById("audit-issues")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      )}

      {previousReport && (
        <ScanComparisonPanel previous={previousReport} current={report} />
      )}

      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Report</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink">Audit results</h2>
            <p className="mt-1 break-all text-sm text-ink-muted">{formatUrlDisplay(report.url)}</p>
            <p className="text-xs text-ink-muted/80">
              Scanned {new Date(report.scannedAt).toLocaleString()} · Overall{" "}
              {formatTenLabel(overallFromScores(report.scores))}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="flex flex-wrap gap-2">
              {onRescan && (
                <button
                  onClick={onRescan}
                  disabled={rescanLoading}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60"
                >
                  {rescanLoading ? "Re-scanning…" : "Re-scan"}
                </button>
              )}
              <ExportButtons report={report} plan={aiPlan} />
              <EmailReportButton report={report} plan={aiPlan} />
            </div>
            <ShareReportButton report={report} />
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-lg bg-rose-100 px-3 py-1 font-medium text-rose-700">
                {report.summary.critical} critical
              </span>
              <span className="rounded-lg bg-amber-soft px-3 py-1 font-medium text-amber-900">
                {report.summary.warning} warnings
              </span>
              <span className="rounded-lg bg-teal-soft px-3 py-1 font-medium text-teal">
                {report.summary.info} info
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          <ScoreGauge label="SEO" score={report.scores.seo} />
          <ScoreGauge label="Performance" score={report.scores.performance} />
          <ScoreGauge label="Accessibility" score={report.scores.accessibility} />
          <ScoreGauge label="Security" score={report.scores.security} />
          <ScoreGauge label="AI visibility" score={report.scores.ai ?? 0} />
        </div>

        {report.performanceMetrics && (
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-paper p-4 sm:grid-cols-5">
            {report.performanceMetrics.lcp && (
              <Metric label="LCP" value={report.performanceMetrics.lcp} />
            )}
            {report.performanceMetrics.cls && (
              <Metric label="CLS" value={report.performanceMetrics.cls} />
            )}
            {report.performanceMetrics.inp && (
              <Metric label="INP" value={report.performanceMetrics.inp} />
            )}
            {report.performanceMetrics.fcp && (
              <Metric label="FCP" value={report.performanceMetrics.fcp} />
            )}
            {report.performanceMetrics.ttfb && (
              <Metric label="TTFB" value={report.performanceMetrics.ttfb} />
            )}
          </div>
        )}
      </div>

      {report.serpPreview && (
        <SerpPreview
          title={report.serpPreview.title}
          description={report.serpPreview.description}
          url={report.serpPreview.url}
        />
      )}

      {report.aiVisibility && <AiVisibilityPanel ai={report.aiVisibility} />}

      {report.siteOverview && <SiteOverviewPanel overview={report.siteOverview} />}

      {report.crawl?.enabled && <SiteCrawlPanel crawl={report.crawl} />}

      {report.issues.length > 0 && <IssueGroupsPanel issues={report.issues} />}

      <div id="audit-issues">
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Issues</p>
          <h3 className="font-display mt-1 text-xl font-semibold text-ink">Everything we found</h3>
          <p className="text-sm text-ink-muted">
            SEO, security, performance, accessibility, links, and domain — with fix recommendations.
          </p>
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                  filter === cat.key
                    ? "bg-ink text-white"
                    : "bg-white text-ink-muted ring-1 ring-ink/10 hover:bg-paper"
                }`}
              >
                {cat.label}
                {cat.key !== "all" && (
                  <span className="ml-1 opacity-70">
                    ({report.issues.filter((i) => i.category === cat.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          {resolvedCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={hideResolved}
                onChange={(e) => setHideResolved(e.target.checked)}
                className="h-4 w-4 rounded border-ink/20"
              />
              Hide resolved ({resolvedCount}/{report.issues.length})
            </label>
          )}
        </div>

        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-teal/20 bg-teal-soft/40 p-8 text-center">
            <p className="font-display text-lg font-semibold text-teal">
              {hideResolved && resolvedCount > 0
                ? "All visible issues resolved"
                : "No issues in this filter"}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {hideResolved
                ? "Uncheck “Hide resolved” to see completed items."
                : "This category looks good for the scanned page."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                resolved={resolved.has(issue.id)}
                onToggleResolved={toggleResolved}
                aiHint={aiIssueHints?.[issue.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

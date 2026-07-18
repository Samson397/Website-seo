"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UrlInput, type ScanSubmitPayload } from "@/components/UrlInput";
import { AuditReportView } from "@/components/AuditReport";
import { ProblemsSummary } from "@/components/ProblemsSummary";
import { ChecksPanel } from "@/components/ChecksPanel";
import { HomeFeatures } from "@/components/HomeFeatures";
import { RouteCards } from "@/components/RouteCards";
import { ScanHistoryPanel } from "@/components/ScanHistoryPanel";
import { BenchmarkCompare } from "@/components/BenchmarkCompare";
import { WatchToggle } from "@/components/WatchToggle";
import { AdSlot } from "@/components/AdSlot";
import { ScanLoadingPanel } from "@/components/ScanLoadingPanel";
import { FreePreviewReport } from "@/components/FreePreviewReport";
import { saveScanToHistory } from "@/lib/local-history";
import { getUnlock, hasFullUnlock, saveUnlock } from "@/lib/unlock";
import { usePaymentsEnabled } from "@/hooks/usePaymentsEnabled";
import { routes } from "@/lib/routes";
import type { CrawlControls } from "@/lib/crawl-options";
import type { AuditReport, AuditCategory, ScanProgressEvent } from "@/lib/types";

const HOME_FAQS = [
  {
    q: "What does a SEOHub full-site audit include?",
    a: "SEOHub crawls public HTML across your site (up to 200 pages), runs 50+ checks covering SEO, performance signals, accessibility, security headers, and AI visibility, then groups issues by URL template so you can fix patterns—not just one-off pages.",
  },
  {
    q: "Do I need an account to run an SEO audit?",
    a: "No. Paste a URL and start. History and watchlists stay on this device. When payments are enabled, a free homepage preview unlocks scores first; a one-time unlock reveals the full crawl, checklist, and exports.",
  },
  {
    q: "How is SEOHub different from enterprise SEO platforms?",
    a: "SEOHub is built for a weekly site check without SaaS lock-in: clear /10 scores, practical fix snippets, free keyword and technical tools, and optional one-time unlock—not a multi-seat subscription.",
  },
  {
    q: "Can JavaScript-heavy sites be audited?",
    a: "We fetch public HTML only (no headless browser). JS-rendered apps may show fewer on-page signals. Static and server-rendered sites get the richest crawl coverage.",
  },
];

type RunAuditFn = (
  url: string,
  isRescan?: boolean,
  forceFull?: boolean,
  sessionOverride?: string,
  crawl?: CrawlControls
) => Promise<void>;

export function HomePageClient() {
  const { enabled: paymentsOn, priceLabel } = usePaymentsEnabled();
  const [unlocked, setUnlocked] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [previousReport, setPreviousReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyTick, setHistoryTick] = useState(0);
  const [scanningUrl, setScanningUrl] = useState("");
  const [progressEvents, setProgressEvents] = useState<ScanProgressEvent[]>([]);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const lastUrl = useRef<string>("");
  const autoStarted = useRef<string | null>(null);
  const unlockHandled = useRef<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [issueFilter, setIssueFilter] = useState<AuditCategory | "all">("all");
  const lastCrawl = useRef<CrawlControls | undefined>(undefined);
  const runAuditRef = useRef<RunAuditFn | null>(null);

  useEffect(() => {
    setUnlocked(!paymentsOn || hasFullUnlock());
  }, [paymentsOn]);

  async function runAudit(
    url: string,
    isRescan = false,
    forceFull = false,
    sessionOverride?: string,
    crawl?: CrawlControls
  ) {
    setLoading(true);
    setScanningUrl(url);
    setError(null);
    setProgressEvents([{ type: "stage", stage: "fetch", message: "Connecting…" }]);

    if (crawl) lastCrawl.current = crawl;
    const crawlOpts = crawl ?? lastCrawl.current;

    if (!isRescan) {
      setPreviousReport(null);
      setReport(null);
    } else if (report) {
      setPreviousReport(report);
    }

    const unlock = getUnlock();
    const sessionId = sessionOverride || unlock?.sessionId;
    const useFull = forceFull || !paymentsOn || Boolean(sessionId);

    try {
      const response = await fetch("/api/audit/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          siteCrawl: useFull,
          unlockSessionId: sessionId,
          ...(useFull && crawlOpts
            ? {
                maxPages: crawlOpts.maxPages,
                includePaths: crawlOpts.includePaths,
                excludePaths: crawlOpts.excludePaths,
                startPath: crawlOpts.startPath,
              }
            : {}),
        }),
      });

      if (!response.ok || !response.body) {
        let msg = "Audit failed";
        try {
          const text = await response.text();
          const first = text.split("\n").find(Boolean);
          if (first) {
            const parsed = JSON.parse(first) as { error?: string };
            if (parsed.error) msg = parsed.error;
          }
        } catch {
          /* keep default */
        }
        if (msg.includes("timeout") || response.status === 504) {
          throw new Error(
            "The scan took too long on this host. Try again in a moment — large sites can take up to a minute."
          );
        }
        throw new Error(msg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let audit: AuditReport | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: ScanProgressEvent;
          try {
            event = JSON.parse(line) as ScanProgressEvent;
          } catch {
            continue;
          }
          if (event.type === "error") {
            throw new Error(event.error);
          }
          if (event.type === "done") {
            audit = event.report;
          } else {
            setProgressEvents((prev) => [...prev.slice(-40), event]);
          }
        }
      }

      if (!audit) throw new Error("Scan finished without a report. Try again.");

      lastUrl.current = url;
      setReport(audit);
      setUnlocked(audit.tier === "full" || !paymentsOn || hasFullUnlock());
      saveScanToHistory(audit);
      setHistoryTick((n) => n + 1);
      setUnlockNotice(null);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      if (isRescan && previousReport) {
        setReport(previousReport);
        setPreviousReport(null);
      }
    } finally {
      setLoading(false);
      setProgressEvents([]);
    }
  }

  runAuditRef.current = runAudit;

  function handleRescan() {
    if (lastUrl.current) void runAudit(lastUrl.current, true, false, undefined, lastCrawl.current);
  }

  function handleScanSubmit({ url, crawl }: ScanSubmitPayload) {
    void runAudit(url, false, false, undefined, crawl);
  }

  const isFreePreview = paymentsOn && report && report.tier !== "full" && !unlocked;
  const showCrawlControls = !paymentsOn || unlocked;

  return (
    <main className="min-h-screen pb-16">
      <Suspense fallback={null}>
        <HomeUrlEffects
          priceLabel={priceLabel}
          lastUrl={lastUrl}
          autoStarted={autoStarted}
          unlockHandled={unlockHandled}
          setUnlocked={setUnlocked}
          setUnlockNotice={setUnlockNotice}
          setError={setError}
          runAuditRef={runAuditRef}
        />
      </Suspense>

      <section className="hero-mesh relative overflow-hidden px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="animate-rise flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14"
              fetchPriority="high"
            />
            <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              SEOHub
            </p>
          </div>
          <h1 className="font-display animate-rise-delay-1 mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-brand-bright sm:text-4xl">
            Free full-site SEO audit you run every week
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base text-white/75 sm:text-lg">
            {paymentsOn
              ? `Crawl every page, run 50+ checks, and unlock the full report for ${priceLabel} — no account.`
              : "Crawl every page, run 50+ checks, and track a watchlist on your device — free, no login."}
          </p>

          <div className="animate-rise-delay-2 glass-panel mt-8 max-w-2xl rounded-2xl border border-white/15 p-4 shadow-glow sm:p-5">
            <UrlInput
              onSubmit={handleScanSubmit}
              loading={loading}
              showCrawlControls={showCrawlControls}
            />
          </div>
          <p className="animate-rise-delay-2 mt-4 max-w-2xl text-xs text-white/55">
            HTML-only crawl: we fetch public HTML (no headless browser). JS-rendered apps may show
            fewer on-page signals.{" "}
            <Link href={routes.sampleReport} className="text-brand-bright underline-offset-2 hover:underline">
              View sample report
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {unlockNotice ? (
          <div className="mt-6 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">
            {unlockNotice}
          </div>
        ) : null}

        {!report && !loading && <ScanHistoryPanel refreshToken={historyTick} />}

        {loading && (
          <ScanLoadingPanel url={scanningUrl || lastUrl.current} events={progressEvents} />
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {report && !loading && (
          <div ref={resultsRef} className="mt-10 space-y-8 pb-12">
            {isFreePreview ? (
              <FreePreviewReport
                report={report}
                onRescan={handleRescan}
                rescanLoading={loading}
              />
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                  Full SEO unlocked
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <WatchToggle report={report} />
                  <Link
                    href={routes.history}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    View History
                  </Link>
                  <p className="text-sm text-ink-muted">Saved on this browser — re-check anytime.</p>
                </div>

                <BenchmarkCompare report={report} />
                <AdSlot className="max-w-3xl" />

                <ProblemsSummary
                  report={report}
                  onJumpToCategory={(category) => {
                    setIssueFilter(category);
                    document
                      .getElementById("audit-issues")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
                {report.checklist && <ChecksPanel checklist={report.checklist} />}
                <AdSlot format="horizontal" />

                <AuditReportView
                  report={report}
                  previousReport={previousReport}
                  onRescan={handleRescan}
                  rescanLoading={loading}
                  showProblemsSummary={false}
                  categoryFilter={issueFilter}
                  onCategoryFilterChange={setIssueFilter}
                />
              </>
            )}
          </div>
        )}

        {!report && !loading && (
          <>
            <RouteCards />
            <div className="mt-10">
              <AdSlot />
            </div>
            <HomeFeatures />
            <section className="mt-12 border-t border-ink/10 px-2 py-10 text-center sm:px-0">
              <h2 className="font-display text-2xl font-semibold text-ink">More free tools</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
                Keyword research, generators, and technical checkers stay free — linked from the
                homepage so crawlers and humans can find them.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ToolLink href={routes.history} label="History & watchlist" />
                <ToolLink href={routes.sampleReport} label="Sample report" />
                <ToolLink href={routes.keywords} label="Keyword research" />
                <ToolLink href={routes.rankChecker} label="Rank checker" />
                <ToolLink href={routes.contentOptimizer} label="Content optimizer" />
                <ToolLink href={routes.metaPreview} label="Meta & SERP preview" />
                <ToolLink href={routes.robotsInspector} label="robots.txt inspector" />
                <ToolLink href={routes.headers} label="Security headers" />
                <ToolLink href={routes.redirects} label="Redirect chain" />
                <ToolLink href={routes.schema} label="JSON-LD schema" />
                <ToolLink href={routes.brokenLinks} label="Broken links" />
                <ToolLink href={routes.sitemapGenerator} label="Sitemap generator" />
                <ToolLink href={routes.robotsGenerator} label="robots.txt generator" />
                <ToolLink href={routes.guides} label="Fix guides" />
                <ToolLink href={routes.competitors} label="Competitor compare" />
                <ToolLink href={routes.tracker} label="Keyword tracker" />
              </div>
            </section>
            <section className="mt-4 border-t border-ink/10 px-2 py-12 text-left sm:px-0">
              <h2 className="font-display text-2xl font-semibold text-ink">
                What you get from a SEOHub weekly audit
              </h2>
              <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-ink-muted">
                <p>
                  SEOHub is a browser-first SEO audit built for the check you actually run every
                  week: crawl public pages, score SEO, speed signals, accessibility, security, and
                  AI visibility, then show fixes in plain language.
                </p>
                <p>
                  Start free with a homepage preview, unlock a full crawl when you need depth, and
                  keep history plus a watchlist on this device. Free tools for keywords, redirects,
                  schema, and generators stay available without a login wall.
                </p>
              </div>
              <h2 className="font-display mt-12 text-2xl font-semibold text-ink">
                Frequently asked questions
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                Straight answers about how SEOHub audits sites, what stays free, and how the weekly
                check fits a lean marketing workflow.
              </p>
              <dl className="mt-8 max-w-3xl space-y-6">
                {HOME_FAQS.map((item) => (
                  <div key={item.q} className="border-t border-ink/10 pt-5">
                    <dt className="font-display text-lg font-semibold text-ink">{item.q}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

/** Isolated so useSearchParams does not force a thin Suspense fallback over the whole page. */
function HomeUrlEffects({
  priceLabel,
  lastUrl,
  autoStarted,
  unlockHandled,
  setUnlocked,
  setUnlockNotice,
  setError,
  runAuditRef,
}: {
  priceLabel: string;
  lastUrl: MutableRefObject<string>;
  autoStarted: MutableRefObject<string | null>;
  unlockHandled: MutableRefObject<string | null>;
  setUnlocked: (v: boolean) => void;
  setUnlockNotice: (v: string | null) => void;
  setError: (v: string | null) => void;
  runAuditRef: MutableRefObject<RunAuditFn | null>;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("unlock_session");
    if (!sessionId || unlockHandled.current === sessionId) return;
    unlockHandled.current = sessionId;

    void (async () => {
      try {
        const res = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok || !data.paid) {
          setError(data.error || "Payment could not be verified.");
          return;
        }
        saveUnlock(sessionId);
        setUnlocked(true);
        setUnlockNotice(`Full SEO unlocked for ${priceLabel}. Running full site scan…`);
        const url = searchParams.get("url")?.trim() || lastUrl.current;
        if (url) {
          autoStarted.current = null;
          void runAuditRef.current?.(url, false, true, sessionId);
        }
      } catch {
        setError("Could not verify payment. Contact support if you were charged.");
      }
    })();
  }, [
    searchParams,
    priceLabel,
    lastUrl,
    autoStarted,
    unlockHandled,
    setUnlocked,
    setUnlockNotice,
    setError,
    runAuditRef,
  ]);

  useEffect(() => {
    if (searchParams.get("unlock_session")) return;
    const url = searchParams.get("url")?.trim();
    if (!url || autoStarted.current === url) return;
    autoStarted.current = url;
    void runAuditRef.current?.(url);
  }, [searchParams, autoStarted, runAuditRef]);

  return null;
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40 hover:bg-brand-soft"
    >
      {label}
    </Link>
  );
}

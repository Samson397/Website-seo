"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UrlInput } from "@/components/UrlInput";
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
import { UnlockFullScan } from "@/components/UnlockFullScan";
import { saveScanToHistory } from "@/lib/local-history";
import { getUnlock, hasFullUnlock, saveUnlock } from "@/lib/unlock";
import { FULL_SCAN_PRICE_LABEL, paymentsEnabledClient } from "@/lib/stripe-public";
import { routes } from "@/lib/routes";
import type { AuditReport, AuditCategory, ScanProgressEvent } from "@/lib/types";

export default function Home() {
  return (
    <Suspense fallback={<HomeShell />}>
      <HomeScanApp />
    </Suspense>
  );
}

function HomeShell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="min-h-screen pb-16">
      <section className="hero-mesh relative overflow-hidden px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-32">
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-bright">
            SEOHub
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            The site check
            <span className="block text-teal-bright">you run every week.</span>
          </h1>
        </div>
      </section>
      {children}
    </main>
  );
}

function HomeScanApp() {
  const searchParams = useSearchParams();
  const paymentsOn = paymentsEnabledClient();
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

  useEffect(() => {
    setUnlocked(!paymentsOn || hasFullUnlock());
  }, [paymentsOn]);

  // Complete Stripe Checkout return
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
        setUnlockNotice(`Full SEO unlocked for ${FULL_SCAN_PRICE_LABEL}. Running full site scan…`);
        const url = searchParams.get("url")?.trim() || lastUrl.current;
        if (url) {
          autoStarted.current = null;
          void runAudit(url, false, true);
        }
      } catch {
        setError("Could not verify payment. Contact support if you were charged.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function runAudit(url: string, isRescan = false, forceFull = false) {
    setLoading(true);
    setScanningUrl(url);
    setError(null);
    setProgressEvents([{ type: "stage", stage: "fetch", message: "Connecting…" }]);

    if (!isRescan) {
      setPreviousReport(null);
      setReport(null);
    } else if (report) {
      setPreviousReport(report);
    }

    const unlock = getUnlock();
    const useFull = forceFull || !paymentsOn || Boolean(unlock?.sessionId);

    try {
      const response = await fetch("/api/audit/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          siteCrawl: useFull,
          unlockSessionId: unlock?.sessionId,
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

  useEffect(() => {
    if (searchParams.get("unlock_session")) return;
    const url = searchParams.get("url")?.trim();
    if (!url || autoStarted.current === url) return;
    autoStarted.current = url;
    void runAudit(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleRescan() {
    if (lastUrl.current) runAudit(lastUrl.current, true);
  }

  const isFreePreview = paymentsOn && report && report.tier !== "full" && !unlocked;

  return (
    <main className="min-h-screen pb-16">
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
          <p className="animate-rise text-xs font-semibold uppercase tracking-[0.22em] text-teal-bright">
            SEOHub
          </p>
          <h1 className="font-display animate-rise-delay-1 mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            The site check
            <span className="block text-teal-bright">you run every week.</span>
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-xl text-base text-white/75 sm:text-lg">
            {paymentsOn
              ? `Free homepage preview. Unlock full-site crawl for ${FULL_SCAN_PRICE_LABEL} — no account.`
              : "Full-site crawl, 50+ checks, shareable reports, and a watchlist — free, no account."}
          </p>

          <div className="animate-rise-delay-2 glass-panel mt-8 max-w-2xl rounded-2xl border border-white/15 p-4 shadow-glow sm:p-5">
            <UrlInput onSubmit={(url) => runAudit(url)} loading={loading} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {unlockNotice ? (
          <div className="mt-6 rounded-xl border border-teal/30 bg-teal-soft px-4 py-3 text-sm text-teal">
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
            {isFreePreview || (paymentsOn && !unlocked && report.tier !== "full") ? (
              <UnlockFullScan url={report.url} />
            ) : null}

            {report.tier === "full" || unlocked ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                Full SEO unlocked
              </p>
            ) : paymentsOn ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Free homepage preview
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <WatchToggle report={report} />
              <Link href={routes.history} className="text-sm font-medium text-teal hover:underline">
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

            {paymentsOn && report.tier !== "full" ? (
              <UnlockFullScan url={report.url} />
            ) : null}
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
                Keyword research, generators, and technical checkers stay free.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ToolLink href={routes.history} label="History & watchlist" />
                <ToolLink href={routes.keywords} label="Keyword research" />
                <ToolLink href={routes.metaPreview} label="Meta & SERP preview" />
                <ToolLink href={routes.redirects} label="Redirect chain" />
                <ToolLink href={routes.guides} label="Fix guides" />
                <ToolLink href={routes.competitors} label="Competitor compare" />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-teal-soft"
    >
      {label}
    </Link>
  );
}

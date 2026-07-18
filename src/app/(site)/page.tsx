"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UrlInput, type ScanSubmitPayload } from "@/components/UrlInput";
import { HomeFeatures } from "@/components/HomeFeatures";
import { RouteCards } from "@/components/RouteCards";
import { ScanHistoryPanel } from "@/components/ScanHistoryPanel";
import { AdSlot } from "@/components/AdSlot";
import { ScanLoadingPanel } from "@/components/ScanLoadingPanel";
import { FreePreviewReport } from "@/components/FreePreviewReport";
import { FullAuditDelivery } from "@/components/FullAuditDelivery";
import { saveScanToHistory } from "@/lib/local-history";
import { getUnlock, hasFullUnlock, saveUnlock } from "@/lib/unlock";
import {
  clearPreviewStash,
  readPreviewStash,
  savePreviewStash,
} from "@/lib/preview-stash";
import { usePaymentsEnabled } from "@/hooks/usePaymentsEnabled";
import { routes } from "@/lib/routes";
import type { CrawlControls } from "@/lib/crawl-options";
import type { AuditReport, ScanProgressEvent } from "@/lib/types";

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
      <section className="hero-mesh relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <div className="relative mx-auto max-w-6xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-hero.png"
            alt="SEOHub"
            width={260}
            height={290}
            className="h-32 w-auto sm:h-40"
          />
          <h1 className="font-display mt-8 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            The site check you run every week.
          </h1>
        </div>
      </section>
      {children}
    </main>
  );
}

function HomeScanApp() {
  const searchParams = useSearchParams();
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
  const [expandingCrawl, setExpandingCrawl] = useState(false);
  const [scanMode, setScanMode] = useState<"free" | "full">("free");
  const lastUrl = useRef<string>("");
  const autoStarted = useRef<string | null>(null);
  const unlockHandled = useRef<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const lastCrawl = useRef<CrawlControls | undefined>(undefined);

  useEffect(() => {
    setUnlocked(!paymentsOn || hasFullUnlock());
  }, [paymentsOn]);

  // Complete Stripe Checkout return — unlock stashed report in place, then expand crawl
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

        const stash = readPreviewStash();
        const url = searchParams.get("url")?.trim() || stash?.url || lastUrl.current;
        const previewId = stash?.previewId;

        if (previewId) {
          const unlockRes = await fetch("/api/audit/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ previewId, sessionId }),
          });
          const unlockData = await unlockRes.json();
          if (unlockRes.ok && unlockData.report) {
            const unlockedReport = unlockData.report as AuditReport;
            setReport(unlockedReport);
            saveScanToHistory(unlockedReport);
            setHistoryTick((n) => n + 1);
            clearPreviewStash();
            setUnlockNotice(
              `Unlocked for ${priceLabel}. Showing your report — expanding to full-site crawl…`
            );
            requestAnimationFrame(() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            if (url) {
              autoStarted.current = null;
              void runAudit(url, true, true, sessionId, undefined, true);
            }
            return;
          }
        }

        setUnlockNotice(`Full SEO unlocked for ${priceLabel}. Running full site scan…`);
        if (url) {
          autoStarted.current = null;
          void runAudit(url, false, true, sessionId);
        }
      } catch {
        setError("Could not verify payment. Contact support if you were charged.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function runAudit(
    url: string,
    isRescan = false,
    forceFull = false,
    sessionOverride?: string,
    crawl?: CrawlControls,
    keepVisible = false
  ) {
    setLoading(!keepVisible);
    setExpandingCrawl(keepVisible);
    setScanningUrl(url);
    setError(null);
    setProgressEvents([{ type: "stage", stage: "fetch", message: "Connecting…" }]);

    if (crawl) lastCrawl.current = crawl;
    const crawlOpts = crawl ?? lastCrawl.current;

    if (!isRescan && !keepVisible) {
      setPreviousReport(null);
      setReport(null);
    } else if (report) {
      setPreviousReport(report);
    }

    const unlock = getUnlock();
    const sessionId = sessionOverride || unlock?.sessionId;
    const useFull = forceFull || !paymentsOn || Boolean(sessionId);
    setScanMode(useFull ? "full" : "free");

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
      if (audit.tier === "free" && audit.previewId) {
        savePreviewStash(audit.previewId, audit.url);
      }
      if (audit.tier === "full") {
        clearPreviewStash();
      }
      saveScanToHistory(audit);
      setHistoryTick((n) => n + 1);
      if (!keepVisible) setUnlockNotice(null);
      else setUnlockNotice(null);
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
      setExpandingCrawl(false);
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
    if (lastUrl.current) runAudit(lastUrl.current, true, false, undefined, lastCrawl.current);
  }

  function handleScanSubmit({ url, crawl }: ScanSubmitPayload) {
    void runAudit(url, false, false, undefined, crawl);
  }

  const isFreePreview = paymentsOn && report && report.tier !== "full" && !unlocked;
  const showCrawlControls = !paymentsOn || unlocked;

  return (
    <main className="min-h-screen pb-16">
      <section className="hero-mesh relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <div className="relative mx-auto max-w-6xl">
          <div className="animate-logo">
            {/* Hero uses slate-baked mark so cutout AA matches the field (no white halo). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-hero.png"
              alt="SEOHub"
              width={260}
              height={290}
              className="h-32 w-auto sm:h-40"
            />
          </div>
          <h1 className="font-display animate-rise-delay-1 mt-8 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Full-site SEO. No subscription.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
            {paymentsOn
              ? `Free homepage scores + AI visibility. Unlock the full crawl and fixes for ${priceLabel}.`
              : "Audit, keywords, rank checks, and tools — free to start, no account."}
          </p>
          <p className="animate-rise-delay-2 mt-3 text-sm font-medium tracking-wide text-ink/70">
            50+ checks · up to 200 pages · no account
          </p>

          <div className="animate-rise-delay-2 scan-shell mt-8 max-w-2xl rounded-2xl p-4 sm:p-5">
            <UrlInput
              onSubmit={handleScanSubmit}
              loading={loading}
              showCrawlControls={showCrawlControls}
            />
          </div>
          <p className="animate-rise-delay-2 mt-4 max-w-2xl text-xs text-ink-muted/80">
            HTML-only crawl: we fetch public HTML (no headless browser). JS-rendered apps may show
            fewer on-page signals.{" "}
            <Link href={routes.sampleReport} className="font-medium text-teal underline-offset-2 hover:underline">
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
          <ScanLoadingPanel
            url={scanningUrl || lastUrl.current}
            events={progressEvents}
            mode={scanMode}
          />
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {report && (!loading || expandingCrawl) && (
          <div ref={resultsRef} className="mt-10 space-y-8 pb-12">
            {expandingCrawl ? (
              <ScanLoadingPanel
                url={scanningUrl || lastUrl.current}
                events={progressEvents}
                mode="full"
              />
            ) : null}
            {isFreePreview ? (
              <FreePreviewReport
                report={report}
                onRescan={handleRescan}
                rescanLoading={loading}
              />
            ) : (
              <FullAuditDelivery
                report={report}
                previousReport={previousReport}
                onRescan={handleRescan}
                rescanLoading={loading}
                expandingCrawl={expandingCrawl}
              />
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
                Keyword research, generators, and technical checkers stay free.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ToolLink href={routes.history} label="History & watchlist" />
                <ToolLink href={routes.sampleReport} label="Sample report" />
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
      className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40 hover:bg-brand-soft"
    >
      {label}
    </Link>
  );
}

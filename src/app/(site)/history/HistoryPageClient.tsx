"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHero, PrimaryCta } from "@/components/ui/PageHero";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { ScanComparisonPanel } from "@/components/ScanComparisonPanel";
import {
  clearScanHistory,
  clearWatchlist,
  getReportStub,
  getScanHistory,
  getWatchlist,
  getWatchlistDueForRescan,
  historyForHostname,
  stubToReport,
  toggleWatch,
  WATCH_RESCAN_DAYS,
  type HistoryEntry,
  type WatchItem,
} from "@/lib/local-history";
import { DigestSignup } from "@/components/DigestSignup";
import { routes, scanUrlFor } from "@/lib/routes";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [ready, setReady] = useState(false);
  const [due, setDue] = useState<WatchItem[]>([]);
  const [chartHost, setChartHost] = useState<string>("");
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");

  function refresh() {
    const next = getScanHistory();
    setHistory(next);
    setWatchlist(getWatchlist());
    setDue(getWatchlistDueForRescan());
    setReady(true);
    if (!chartHost && next[0]?.hostname) {
      setChartHost(next[0].hostname);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hosts = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const h of history) {
      if (!seen.has(h.hostname)) {
        seen.add(h.hostname);
        list.push(h.hostname);
      }
    }
    return list;
  }, [history]);

  const hostHistory = chartHost ? historyForHostname(chartHost) : [];
  const compareOptions = hostHistory.filter((h) => h.stubId);

  const comparison =
    compareA && compareB && compareA !== compareB
      ? (() => {
          const a = getReportStub(compareA);
          const b = getReportStub(compareB);
          if (!a || !b) return null;
          // older as previous, newer as current
          const [prev, curr] =
            new Date(a.scannedAt).getTime() <= new Date(b.scannedAt).getTime()
              ? [a, b]
              : [b, a];
          return { previous: stubToReport(prev), current: stubToReport(curr) };
        })()
      : null;

  const empty = ready && history.length === 0 && watchlist.length === 0;

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="On this device"
        title="History"
        description="Track score progress, compare past scans, and re-check watched sites — stored in this browser only."
        actions={<PrimaryCta href={routes.home}>New scan</PrimaryCta>}
      />

      <div className="mx-auto mt-10 max-w-6xl space-y-12 px-4 sm:px-6">
        {due.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-soft/50 px-5 py-4">
            <p className="font-medium text-amber-950">
              {due.length} watched site{due.length === 1 ? "" : "s"} due for a weekly re-scan
            </p>
            <p className="mt-1 text-sm text-amber-900/80">
              Last scan older than {WATCH_RESCAN_DAYS} days — keep scores fresh.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {due.map((item) => (
                <Link
                  key={item.hostname}
                  href={scanUrlFor(item.url)}
                  className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-soft"
                >
                  Scan {item.hostname}
                </Link>
              ))}
            </ul>
          </div>
        )}

        {empty && (
          <div className="border-t border-ink/10 px-2 py-12 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">No scans yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              Run a full site scan, then use Watch to pin sites you want to check every week.
            </p>
            <Link
              href={routes.home}
              className="mt-6 inline-flex rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-bright"
            >
              Scan a site
            </Link>
          </div>
        )}

        {watchlist.length > 0 && <DigestSignup watchlist={watchlist} />}

        {hosts.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                  Progress
                </p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-ink">
                  Score over time
                </h2>
              </div>
              <label className="text-sm text-ink-muted">
                Site{" "}
                <select
                  value={chartHost}
                  onChange={(e) => {
                    setChartHost(e.target.value);
                    setCompareA("");
                    setCompareB("");
                  }}
                  className="ml-2 rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-ink"
                >
                  {hosts.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ScoreHistoryChart entries={history} hostname={chartHost} />

            {compareOptions.length >= 2 && (
              <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Compare two scans
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Side-by-side fixed vs new issues from saved reports on this device.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="text-sm text-ink-muted">
                    Older{" "}
                    <select
                      value={compareA}
                      onChange={(e) => setCompareA(e.target.value)}
                      className="ml-2 rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-ink"
                    >
                      <option value="">Select…</option>
                      {compareOptions.map((h) => (
                        <option key={h.stubId} value={h.stubId}>
                          {new Date(h.scannedAt).toLocaleString()} · {h.overall}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-ink-muted">
                    Newer{" "}
                    <select
                      value={compareB}
                      onChange={(e) => setCompareB(e.target.value)}
                      className="ml-2 rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-ink"
                    >
                      <option value="">Select…</option>
                      {compareOptions.map((h) => (
                        <option key={h.stubId} value={h.stubId}>
                          {new Date(h.scannedAt).toLocaleString()} · {h.overall}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {comparison ? (
                  <div className="mt-4">
                    <ScanComparisonPanel
                      previous={comparison.previous}
                      current={comparison.current}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}

        {watchlist.length > 0 && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                  Watchlist
                </p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-ink">
                  Sites you track
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearWatchlist();
                  refresh();
                }}
                className="text-xs font-medium text-ink-muted hover:text-rose-600"
              >
                Clear watchlist
              </button>
            </div>
            <ul className="mt-5 divide-y divide-ink/5 border-t border-ink/10">
              {watchlist.map((item) => (
                <li
                  key={item.hostname}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{item.hostname}</p>
                    <p className="text-xs text-ink-muted">
                      {item.lastOverall != null
                        ? `Last score ${item.lastOverall}`
                        : "Not rescanned yet"}
                      {item.lastScannedAt
                        ? ` · ${new Date(item.lastScannedAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={scanUrlFor(item.url)}
                      className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-bright"
                    >
                      Scan now
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setWatchlist(toggleWatch(item.url));
                      }}
                      className="rounded-lg bg-mist px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {history.length > 0 && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Recent</p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-ink">Scan history</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearScanHistory();
                  refresh();
                }}
                className="text-xs font-medium text-ink-muted hover:text-rose-600"
              >
                Clear history
              </button>
            </div>
            <ul className="mt-5 divide-y divide-ink/5 border-t border-ink/10">
              {history.map((item) => (
                <li
                  key={`${item.hostname}-${item.scannedAt}`}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{item.hostname}</p>
                    <p className="text-xs text-ink-muted">
                      Score {item.overall}
                      {item.scoreDelta != null && item.scoreDelta !== 0 ? (
                        <span
                          className={
                            item.scoreDelta > 0 ? "text-teal" : "text-rose-600"
                          }
                        >
                          {" "}
                          ({item.scoreDelta > 0 ? "↑" : "↓"}
                          {Math.abs(item.scoreDelta)} since previous)
                        </span>
                      ) : null}
                      {item.pagesScanned != null ? ` · ${item.pagesScanned} pages` : ""}
                      {item.failCount != null ? ` · ${item.failCount} failed checks` : ""}
                      {" · "}
                      {new Date(item.scannedAt).toLocaleString()}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-muted">
                      <span>SEO {item.scores.seo}</span>
                      <span>Speed {item.scores.performance}</span>
                      <span>A11y {item.scores.accessibility}</span>
                      <span>Security {item.scores.security}</span>
                    </div>
                  </div>
                  <Link
                    href={scanUrlFor(item.url)}
                    className="shrink-0 self-start rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal/40 hover:text-teal sm:self-center"
                  >
                    Re-scan
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-muted">
              Stored in this browser only. Clearing site data removes history and compare stubs.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

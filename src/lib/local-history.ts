import type { AuditReport } from "@/lib/types";

const HISTORY_KEY = "seohub-scan-history-v1";
const HISTORY_KEY_LEGACY = "seoscan-scan-history-v1";
const WATCHLIST_KEY = "seohub-watchlist-v1";
const WATCHLIST_KEY_LEGACY = "seoscan-watchlist-v1";
const MAX_HISTORY = 25;
const MAX_WATCH = 12;
/** Re-scan watchlist items after this many days */
export const WATCH_RESCAN_DAYS = 7;

export interface HistoryEntry {
  url: string;
  hostname: string;
  scannedAt: string;
  overall: number;
  /** Previous overall score for this hostname, if any */
  previousOverall?: number;
  /** overall - previousOverall */
  scoreDelta?: number;
  scores: AuditReport["scores"];
  pagesScanned?: number;
  failCount?: number;
  passCount?: number;
}

export interface WatchItem {
  url: string;
  hostname: string;
  addedAt: string;
  lastOverall?: number;
  lastScannedAt?: string;
}

function overallFromScores(scores: AuditReport["scores"]): number {
  return Math.round(
    (scores.seo + scores.performance + scores.accessibility + scores.security) / 4
  );
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function readJson<T>(key: string, legacyKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) {
      const parsed = JSON.parse(legacy) as T;
      localStorage.setItem(key, legacy);
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode
  }
}

export function getScanHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  return readJson<HistoryEntry[]>(HISTORY_KEY, HISTORY_KEY_LEGACY, []);
}

export function saveScanToHistory(report: AuditReport): HistoryEntry[] {
  const hostname = hostnameFromUrl(report.url);
  const overall = overallFromScores(report.scores);
  const existing = getScanHistory().find((h) => h.hostname === hostname);
  const previousOverall = existing?.overall;
  const scoreDelta =
    previousOverall != null ? overall - previousOverall : undefined;

  const entry: HistoryEntry = {
    url: report.url,
    hostname,
    scannedAt: report.scannedAt,
    overall,
    previousOverall,
    scoreDelta,
    scores: report.scores,
    pagesScanned: report.crawl?.pagesScanned,
    failCount: report.checklist?.failCount ?? report.checklist?.missingCount,
    passCount: report.checklist?.passCount ?? report.checklist?.hasCount,
  };

  const prev = getScanHistory().filter((h) => h.hostname !== entry.hostname);
  const next = [entry, ...prev].slice(0, MAX_HISTORY);
  writeJson(HISTORY_KEY, next);

  const watch = getWatchlist();
  const idx = watch.findIndex((w) => w.hostname === entry.hostname);
  if (idx >= 0) {
    watch[idx] = {
      ...watch[idx],
      lastOverall: entry.overall,
      lastScannedAt: entry.scannedAt,
    };
    writeJson(WATCHLIST_KEY, watch);
  }

  return next;
}

export function getWatchlist(): WatchItem[] {
  if (typeof window === "undefined") return [];
  return readJson<WatchItem[]>(WATCHLIST_KEY, WATCHLIST_KEY_LEGACY, []);
}

export function getWatchlistDueForRescan(): WatchItem[] {
  const cutoff = Date.now() - WATCH_RESCAN_DAYS * 24 * 60 * 60 * 1000;
  return getWatchlist().filter((w) => {
    if (!w.lastScannedAt) return true;
    return new Date(w.lastScannedAt).getTime() < cutoff;
  });
}

export function isWatched(url: string): boolean {
  const host = hostnameFromUrl(url);
  return getWatchlist().some((w) => w.hostname === host);
}

export function toggleWatch(url: string, report?: AuditReport): WatchItem[] {
  const hostname = hostnameFromUrl(url);
  const current = getWatchlist();
  const existing = current.find((w) => w.hostname === hostname);
  if (existing) {
    const next = current.filter((w) => w.hostname !== hostname);
    writeJson(WATCHLIST_KEY, next);
    return next;
  }
  const item: WatchItem = {
    url,
    hostname,
    addedAt: new Date().toISOString(),
    lastOverall: report ? overallFromScores(report.scores) : undefined,
    lastScannedAt: report?.scannedAt,
  };
  const next = [item, ...current].slice(0, MAX_WATCH);
  writeJson(WATCHLIST_KEY, next);
  return next;
}

export function clearScanHistory(): void {
  writeJson(HISTORY_KEY, []);
}

export function clearWatchlist(): void {
  writeJson(WATCHLIST_KEY, []);
}

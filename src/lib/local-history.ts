import type { AuditReport } from "@/lib/types";

const HISTORY_KEY = "seoscan-scan-history-v1";
const WATCHLIST_KEY = "seoscan-watchlist-v1";
const MAX_HISTORY = 25;
const MAX_WATCH = 12;

export interface HistoryEntry {
  url: string;
  hostname: string;
  scannedAt: string;
  overall: number;
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

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
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
  return readJson<HistoryEntry[]>(HISTORY_KEY, []);
}

export function saveScanToHistory(report: AuditReport): HistoryEntry[] {
  const entry: HistoryEntry = {
    url: report.url,
    hostname: hostnameFromUrl(report.url),
    scannedAt: report.scannedAt,
    overall: overallFromScores(report.scores),
    scores: report.scores,
    pagesScanned: report.crawl?.pagesScanned,
    failCount: report.checklist?.failCount ?? report.checklist?.missingCount,
    passCount: report.checklist?.passCount ?? report.checklist?.hasCount,
  };

  const prev = getScanHistory().filter((h) => h.hostname !== entry.hostname);
  const next = [entry, ...prev].slice(0, MAX_HISTORY);
  writeJson(HISTORY_KEY, next);

  // Keep watchlist scores fresh if this domain is watched
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
  return readJson<WatchItem[]>(WATCHLIST_KEY, []);
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


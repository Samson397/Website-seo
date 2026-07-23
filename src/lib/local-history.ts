import type { AuditIssue, AuditReport, AuditScores, AuditSummary, SiteChecklist } from "@/lib/types";

const HISTORY_KEY = "seohub-scan-history-v1";
const HISTORY_KEY_LEGACY = "seoscan-scan-history-v1";
const WATCHLIST_KEY = "seohub-watchlist-v1";
const WATCHLIST_KEY_LEGACY = "seoscan-watchlist-v1";
const STUBS_KEY = "seohub-report-stubs-v1";
const MAX_HISTORY = 40;
const MAX_WATCH = 12;
const MAX_STUBS = 12;
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
  /** Links to a stored stub for side-by-side compare */
  stubId?: string;
}

export interface WatchItem {
  url: string;
  hostname: string;
  addedAt: string;
  lastOverall?: number;
  lastScannedAt?: string;
}

/** Slim report kept in localStorage for history compare (no crawl page list). */
export interface StoredReportStub {
  id: string;
  url: string;
  hostname: string;
  scannedAt: string;
  overall: number;
  scores: AuditScores;
  summary: AuditSummary;
  issues: Pick<
    AuditIssue,
    "category" | "severity" | "title" | "description" | "recommendation" | "priorityLabel"
  >[];
  checklist?: Pick<SiteChecklist, "passCount" | "failCount" | "attentionCount" | "items">;
}

function overallFromScores(scores: AuditReport["scores"]): number {
  const parts = [
    scores.seo,
    scores.performance,
    scores.accessibility,
    scores.security,
    scores.ai,
  ].filter((n): n is number => typeof n === "number");
  return Math.round(parts.reduce((a, b) => a + b, 0) / Math.max(1, parts.length));
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

function slimReport(report: AuditReport): StoredReportStub {
  const hostname = hostnameFromUrl(report.url);
  const overall = overallFromScores(report.scores);
  return {
    id: `${hostname}::${report.scannedAt}`,
    url: report.url,
    hostname,
    scannedAt: report.scannedAt,
    overall,
    scores: report.scores,
    summary: report.summary,
    issues: report.issues.slice(0, 80).map((i) => ({
      category: i.category,
      severity: i.severity,
      title: i.title,
      description: i.description,
      recommendation: i.recommendation,
      priorityLabel: i.priorityLabel,
    })),
    checklist: report.checklist
      ? {
          passCount: report.checklist.passCount,
          failCount: report.checklist.failCount,
          attentionCount: report.checklist.attentionCount,
          items: report.checklist.items,
        }
      : undefined,
  };
}

function getStubs(): StoredReportStub[] {
  if (typeof window === "undefined") return [];
  return readJson<StoredReportStub[]>(STUBS_KEY, STUBS_KEY, []);
}

function saveStub(report: AuditReport): string {
  const stub = slimReport(report);
  const prev = getStubs().filter((s) => s.id !== stub.id);
  writeJson(STUBS_KEY, [stub, ...prev].slice(0, MAX_STUBS));
  return stub.id;
}

export function getReportStub(id: string): StoredReportStub | null {
  return getStubs().find((s) => s.id === id) || null;
}

export function getReportStubsForHost(hostname: string): StoredReportStub[] {
  return getStubs().filter((s) => s.hostname === hostname);
}

/** Convert a stub into a minimal AuditReport for ScanComparisonPanel. */
export function stubToReport(stub: StoredReportStub): AuditReport {
  return {
    url: stub.url,
    scannedAt: stub.scannedAt,
    scores: stub.scores,
    summary: stub.summary,
    issues: stub.issues.map((i, idx) => ({
      id: `stub-${idx}`,
      category: i.category,
      severity: i.severity,
      title: i.title,
      description: i.description,
      recommendation: i.recommendation,
      priorityLabel: i.priorityLabel,
    })),
    checklist: stub.checklist
      ? {
          ...stub.checklist,
          hasCount: stub.checklist.passCount,
          missingCount: stub.checklist.failCount,
          warningCount: stub.checklist.attentionCount,
          summary: `${stub.checklist.passCount} pass · ${stub.checklist.failCount} fail · ${stub.checklist.attentionCount} attention`,
        }
      : undefined,
    tier: "full",
  };
}

export function saveScanToHistory(report: AuditReport): HistoryEntry[] {
  const hostname = hostnameFromUrl(report.url);
  const overall = overallFromScores(report.scores);
  // Keep prior scans for the same host so score-over-time works
  const priorSameHost = getScanHistory().find((h) => h.hostname === hostname);
  const previousOverall = priorSameHost?.overall;
  const scoreDelta =
    previousOverall != null ? overall - previousOverall : undefined;

  const stubId = saveStub(report);

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
    stubId,
  };

  // Append timeline (do not collapse to one row per hostname)
  const next = [entry, ...getScanHistory()].slice(0, MAX_HISTORY);
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

export function historyForHostname(hostname: string): HistoryEntry[] {
  return getScanHistory().filter((h) => h.hostname === hostname);
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
  writeJson(STUBS_KEY, []);
}

export function clearWatchlist(): void {
  writeJson(WATCHLIST_KEY, []);
}

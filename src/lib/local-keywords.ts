const KEYWORDS_KEY = "seohub-keywords-v1";
const KEYWORDS_KEY_LEGACY = "seoscan-keywords-v1";
const MAX_KEYWORDS = 50;

export interface KeywordHistoryPoint {
  at: string;
  score: number;
  serpPosition?: number | null;
}

export interface KeywordTrackItem {
  keyword: string;
  url: string;
  hostname: string;
  addedAt: string;
  lastCheckedAt?: string;
  /** On-page score 0–100 from rank checker */
  lastScore?: number;
  lastSerpPosition?: number | null;
  inTitle?: boolean;
  inH1?: boolean;
  inMeta?: boolean;
  inUrl?: boolean;
  bodyCount?: number;
  /** Local score history for sparkline charts (newest last). */
  history?: KeywordHistoryPoint[];
}

const MAX_HISTORY = 30;

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
    /* quota */
  }
}

function loadKeywords(): KeywordTrackItem[] {
  if (typeof window === "undefined") return [];
  const current = readJson<KeywordTrackItem[]>(KEYWORDS_KEY, []);
  if (current.length > 0) return current;
  const legacy = readJson<KeywordTrackItem[]>(KEYWORDS_KEY_LEGACY, []);
  if (legacy.length > 0) {
    writeJson(KEYWORDS_KEY, legacy);
    return legacy;
  }
  return [];
}

export function getTrackedKeywords(): KeywordTrackItem[] {
  return loadKeywords();
}

export function addTrackedKeyword(keyword: string, url: string): KeywordTrackItem[] {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) return loadKeywords();
  const current = loadKeywords().filter(
    (k) => !(k.keyword === trimmed && k.hostname === hostnameFromUrl(url))
  );
  const item: KeywordTrackItem = {
    keyword: trimmed,
    url,
    hostname: hostnameFromUrl(url),
    addedAt: new Date().toISOString(),
  };
  const next = [item, ...current].slice(0, MAX_KEYWORDS);
  writeJson(KEYWORDS_KEY, next);
  return next;
}

export function removeTrackedKeyword(keyword: string, url: string): KeywordTrackItem[] {
  const host = hostnameFromUrl(url);
  const next = loadKeywords().filter((k) => !(k.keyword === keyword && k.hostname === host));
  writeJson(KEYWORDS_KEY, next);
  return next;
}

export function updateTrackedKeyword(
  keyword: string,
  url: string,
  patch: Partial<KeywordTrackItem>
): KeywordTrackItem[] {
  const host = hostnameFromUrl(url);
  const next = loadKeywords().map((k) => {
    if (!(k.keyword === keyword && k.hostname === host)) return k;
    const merged: KeywordTrackItem = { ...k, ...patch };
    if (patch.lastScore != null) {
      const point: KeywordHistoryPoint = {
        at: patch.lastCheckedAt || new Date().toISOString(),
        score: patch.lastScore,
        serpPosition:
          patch.lastSerpPosition !== undefined ? patch.lastSerpPosition : k.lastSerpPosition,
      };
      const history = [...(k.history || []), point].slice(-MAX_HISTORY);
      merged.history = history;
    }
    return merged;
  });
  writeJson(KEYWORDS_KEY, next);
  return next;
}

export function clearTrackedKeywords(): void {
  writeJson(KEYWORDS_KEY, []);
}

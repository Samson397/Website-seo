/** Shared crawl control parsing/validation for API + UI. */

export const HARD_MAX_PAGES = 200;
export const DEFAULT_MAX_PAGES = 200;

export interface CrawlControls {
  /** Cap unique pages to scan (1–200). */
  maxPages?: number;
  /** Only crawl paths matching these prefixes/globs (e.g. `/blog`, `/products/*`). */
  includePaths?: string[];
  /** Skip paths matching these prefixes/globs. */
  excludePaths?: string[];
  /** Start crawl at this path on the same origin (e.g. `/blog`). */
  startPath?: string;
}

export function resolveMaxPages(requested?: number): number {
  if (requested == null || !Number.isFinite(requested)) return DEFAULT_MAX_PAGES;
  return Math.max(1, Math.min(HARD_MAX_PAGES, Math.floor(requested)));
}

export function normalizePathPattern(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let p = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // Drop query/hash if pasted
  p = p.split("?")[0].split("#")[0];
  if (p.length > 1 && p.endsWith("/") && !p.endsWith("*/")) {
    p = p.slice(0, -1);
  }
  return p || "/";
}

export function parsePathList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .filter((v): v is string => typeof v === "string")
      .map(normalizePathPattern)
      .filter((v): v is string => Boolean(v));
  }
  if (typeof input === "string") {
    return input
      .split(/[\n,]+/)
      .map(normalizePathPattern)
      .filter((v): v is string => Boolean(v));
  }
  return [];
}

/** Match pathname against include/exclude patterns (`*` = suffix wildcard). */
export function pathMatchesPatterns(pathname: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;
  const path = pathname || "/";
  return patterns.some((pattern) => {
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      return path === prefix.replace(/\/$/, "") || path.startsWith(prefix);
    }
    return path === pattern || path.startsWith(`${pattern}/`);
  });
}

export function isPathAllowed(
  pathname: string,
  includePaths: string[],
  excludePaths: string[]
): boolean {
  if (excludePaths.length > 0 && pathMatchesPatterns(pathname, excludePaths)) {
    return false;
  }
  if (includePaths.length > 0 && !pathMatchesPatterns(pathname, includePaths)) {
    return false;
  }
  return true;
}

export function parseCrawlControls(body: Record<string, unknown> | null | undefined): CrawlControls {
  if (!body || typeof body !== "object") return {};
  const maxRaw = body.maxPages ?? body.max_pages;
  const maxPages =
    typeof maxRaw === "number"
      ? maxRaw
      : typeof maxRaw === "string" && maxRaw.trim()
        ? Number(maxRaw)
        : undefined;

  const startRaw = body.startPath ?? body.start_path;
  const startPath =
    typeof startRaw === "string" && startRaw.trim()
      ? normalizePathPattern(startRaw) || undefined
      : undefined;

  return {
    maxPages: maxPages != null && Number.isFinite(maxPages) ? resolveMaxPages(maxPages) : undefined,
    includePaths: parsePathList(body.includePaths ?? body.include_paths),
    excludePaths: parsePathList(body.excludePaths ?? body.exclude_paths),
    startPath,
  };
}

export function resolveStartUrl(originUrl: string, startPath?: string): string {
  if (!startPath || startPath === "/") return originUrl;
  try {
    const origin = new URL(originUrl).origin;
    return new URL(startPath, origin).href;
  } catch {
    return originUrl;
  }
}

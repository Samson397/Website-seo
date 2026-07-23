import * as cheerio from "cheerio";
import { safeFetch, safeFetchText } from "@/lib/fetcher";
import {
  HARD_MAX_PAGES,
  isPathAllowed,
  resolveMaxPages,
  resolveStartUrl,
  type CrawlControls,
} from "@/lib/crawl-options";

export interface CrawledPageMeta {
  url: string;
  title: string;
  description: string;
  h1: string;
  status: number;
  canonical?: string;
  robots?: string;
  hasOg?: boolean;
  wordCount?: number;
  h1Count?: number;
  depth?: number;
  inboundLinks?: number;
  redirected?: boolean;
  requestedUrl?: string;
  finalUrl?: string;
  hreflang?: string[];
  /** Light signals extracted while HTML is in memory */
  missingAltCount?: number;
  imageCount?: number;
  hasJsonLd?: boolean;
  noindex?: boolean;
  /** Sample of outbound http(s) links for site-wide broken-link checks */
  outboundSample?: string[];
}

/**
 * Hard cap on unique URLs we discover AND deep-scan.
 * Every discovered page is scanned — we do not list pages without scanning them.
 */
export const MAX_PAGES = HARD_MAX_PAGES;

export interface DiscoverResult {
  urlsToScan: string[];
  allDiscovered: string[];
  totalFound: number;
  hitCap: boolean;
}

function parseSitemapUrls(xml: string, origin: string, cap: number): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null && urls.length < cap) {
    try {
      const parsed = new URL(match[1].trim());
      if (parsed.origin === origin) urls.push(parsed.href);
    } catch {
      // skip invalid
    }
  }
  return urls;
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml);
}

async function collectSitemapUrls(entryUrl: string, cap: number): Promise<string[]> {
  const origin = new URL(entryUrl).origin;
  const found = new Set<string>();

  const rootXml = await safeFetchText("/sitemap.xml", entryUrl);
  if (!rootXml) return [];

  async function ingest(xml: string) {
    if (found.size >= cap) return;

    if (isSitemapIndex(xml)) {
      const childSitemaps = parseSitemapUrls(xml, origin, 30).filter((u) => /\.xml$/i.test(u));
      for (const childUrl of childSitemaps) {
        if (found.size >= cap) break;
        try {
          const res = await safeFetch(childUrl);
          if (res.html && res.status < 400) {
            await ingest(res.html);
          }
        } catch {
          // skip unreachable child sitemap
        }
      }
      return;
    }

    for (const u of parseSitemapUrls(xml, origin, cap - found.size)) {
      found.add(u);
      if (found.size >= cap) break;
    }
  }

  await ingest(rootXml);
  return Array.from(found);
}

function extractInternalLinks(html: string, baseUrl: string, origin: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.origin === origin && resolved.protocol.startsWith("http")) {
        if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|css|js|zip|mp4|mp3|ico)(\?|$)/i.test(resolved.pathname)) {
          return;
        }
        resolved.hash = "";
        links.add(resolved.href);
      }
    } catch {
      // skip
    }
  });

  return Array.from(links);
}

function normalizeUrl(u: string): string {
  try {
    const p = new URL(u);
    p.hash = "";
    const href = p.href.replace(/\/$/, "") || p.href;
    return href;
  } catch {
    return u;
  }
}

function normalizeUrls(urls: string[]): string[] {
  return urls.map(normalizeUrl).filter((u, i, arr) => arr.indexOf(u) === i);
}

function prioritizeUrls(entryUrl: string, urls: string[]): string[] {
  const entryNormalized = normalizeUrl(entryUrl);
  const entry =
    urls.find((u) => u === entryNormalized || u.startsWith(entryNormalized)) || urls[0];
  const rest = urls.filter((u) => u !== entry);
  return entry ? [entry, ...rest] : rest;
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return "/";
  }
}

function urlAllowed(url: string, controls: CrawlControls): boolean {
  return isPathAllowed(
    pathnameOf(url),
    controls.includePaths || [],
    controls.excludePaths || []
  );
}

export async function discoverPages(
  entryUrl: string,
  html: string,
  controls: CrawlControls = {}
): Promise<DiscoverResult> {
  const cap = resolveMaxPages(controls.maxPages);
  const origin = new URL(entryUrl).origin;
  const discovered = new Set<string>();
  discovered.add(normalizeUrl(entryUrl));

  for (const url of await collectSitemapUrls(entryUrl, cap)) {
    if (!urlAllowed(url, controls)) continue;
    discovered.add(normalizeUrl(url));
    if (discovered.size >= cap) break;
  }

  for (const link of extractInternalLinks(html, entryUrl, origin)) {
    if (!urlAllowed(link, controls)) continue;
    discovered.add(normalizeUrl(link));
    if (discovered.size >= cap) break;
  }

  const allDiscovered = prioritizeUrls(entryUrl, normalizeUrls(Array.from(discovered)));
  const totalFound = allDiscovered.length;
  const hitCap = totalFound >= cap;

  return {
    urlsToScan: allDiscovered,
    allDiscovered,
    totalFound,
    hitCap,
  };
}

export function extractMetaFromHtml(url: string, html: string, status: number): CrawledPageMeta {
  const $ = cheerio.load(html);

  const hreflang: string[] = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const lang = $(el).attr("hreflang")?.trim();
    if (lang) hreflang.push(lang);
  });

  let imageCount = 0;
  let missingAltCount = 0;
  $("img").each((_, el) => {
    imageCount += 1;
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null) missingAltCount += 1;
  });

  const robots = $('meta[name="robots"]').attr("content")?.trim() || "";
  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;

  const outboundSample = new Set<string>();
  $("a[href]").each((_, el) => {
    if (outboundSample.size >= 8) return;
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }
    try {
      const resolved = new URL(href, url);
      if (!resolved.protocol.startsWith("http")) return;
      if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|css|js|zip|mp4|mp3|ico)(\?|$)/i.test(resolved.pathname)) {
        return;
      }
      resolved.hash = "";
      outboundSample.add(resolved.href);
    } catch {
      // skip
    }
  });

  $("script, style, noscript").remove();
  const text = $.text().replace(/\s+/g, " ").trim();
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  const h1Count = $("h1").length;

  return {
    url,
    title: $("title").first().text().trim() || "(no title)",
    description: $('meta[name="description"]').attr("content")?.trim() || "",
    h1: $("h1").first().text().trim() || "",
    status,
    canonical: $('link[rel="canonical"]').attr("href")?.trim() || "",
    robots,
    hasOg: Boolean($('meta[property="og:title"]').attr("content")),
    wordCount,
    h1Count,
    hreflang,
    missingAltCount,
    imageCount,
    hasJsonLd,
    noindex: /noindex/i.test(robots),
    outboundSample: Array.from(outboundSample),
  };
}

export async function fetchPageMeta(url: string): Promise<{
  meta: CrawledPageMeta;
  html?: string;
  internalLinks?: string[];
} | null> {
  try {
    const result = await safeFetch(url);
    const redirected = normalizeUrl(result.finalUrl) !== normalizeUrl(url);
    if (!result.html) {
      return {
        meta: {
          url: result.finalUrl,
          title: "(no content)",
          description: "",
          h1: "",
          status: result.status,
          canonical: "",
          robots: "",
          hasOg: false,
          wordCount: 0,
          h1Count: 0,
          redirected,
          requestedUrl: url,
          finalUrl: result.finalUrl,
          hreflang: [],
        },
      };
    }
    const meta = extractMetaFromHtml(result.finalUrl, result.html, result.status);
    meta.redirected = redirected;
    meta.requestedUrl = url;
    meta.finalUrl = result.finalUrl;
    const origin = new URL(result.finalUrl).origin;
    return {
      meta,
      html: result.html,
      internalLinks: extractInternalLinks(result.html, result.finalUrl, origin),
    };
  } catch {
    return null;
  }
}

export type CrawlProgress = {
  scanned: number;
  queued: number;
  lastPath?: string;
};

/**
 * Discover pages from sitemap + links, then deep-scan every discovered URL.
 * Uses BFS link expansion while under the page cap so nested pages are not missed.
 */
export async function crawlSitePages(
  entryUrl: string,
  entryHtml: string,
  onProgress?: (p: CrawlProgress) => void,
  controls: CrawlControls = {}
): Promise<{
  pages: CrawledPageMeta[];
  urlsToScan: string[];
  allDiscovered: string[];
  totalFound: number;
  hitCap: boolean;
  controlsApplied: Required<Pick<CrawlControls, "maxPages">> & CrawlControls;
}> {
  const cap = resolveMaxPages(controls.maxPages);
  const includePaths = controls.includePaths || [];
  const excludePaths = controls.excludePaths || [];
  const startUrl = resolveStartUrl(entryUrl, controls.startPath);

  let seedHtml = entryHtml;
  let crawlEntry = entryUrl;

  if (normalizeUrl(startUrl) !== normalizeUrl(entryUrl)) {
    crawlEntry = startUrl;
    try {
      const startFetch = await safeFetch(startUrl);
      if (startFetch.html) {
        seedHtml = startFetch.html;
        crawlEntry = startFetch.finalUrl;
      }
    } catch {
      // fall back to original entry
      crawlEntry = entryUrl;
      seedHtml = entryHtml;
    }
  }

  const origin = new URL(crawlEntry).origin;
  const applied: CrawlControls & { maxPages: number } = {
    maxPages: cap,
    includePaths,
    excludePaths,
    startPath: controls.startPath,
  };

  const { urlsToScan: seedUrls, hitCap: seedHitCap } = await discoverPages(
    crawlEntry,
    seedHtml,
    applied
  );

  const queued = prioritizeUrls(crawlEntry, seedUrls);
  const seen = new Set(queued.map(normalizeUrl));
  const results: CrawledPageMeta[] = [];
  const scanned = new Set<string>();
  const depthMap = new Map<string, number>();
  const inboundMap = new Map<string, number>();
  depthMap.set(normalizeUrl(crawlEntry), 0);

  let cursor = 0;
  const batchSize = 10;

  while (cursor < queued.length && results.length < cap) {
    const batch = queued.slice(cursor, cursor + batchSize);
    cursor += batch.length;

    const batchResults = await Promise.all(batch.map((u) => fetchPageMeta(u)));

    for (let i = 0; i < batchResults.length; i++) {
      const item = batchResults[i];
      const sourceUrl = batch[i];
      if (!item) continue;

      const key = normalizeUrl(item.meta.url || sourceUrl);
      if (scanned.has(key)) continue;
      scanned.add(key);

      const depth = depthMap.get(normalizeUrl(sourceUrl)) ?? depthMap.get(key) ?? 0;
      item.meta.depth = depth;
      item.meta.inboundLinks = inboundMap.get(key) || 0;
      results.push(item.meta);

      try {
        const lastPath = new URL(item.meta.url).pathname || "/";
        onProgress?.({ scanned: results.length, queued: queued.length, lastPath });
      } catch {
        onProgress?.({ scanned: results.length, queued: queued.length });
      }

      if (item.internalLinks && seen.size < cap) {
        for (const link of item.internalLinks) {
          if (!urlAllowed(link, applied)) continue;
          const n = normalizeUrl(link);
          inboundMap.set(n, (inboundMap.get(n) || 0) + 1);
          if (!seen.has(n) && seen.size < cap) {
            seen.add(n);
            depthMap.set(n, depth + 1);
            queued.push(n);
          }
        }
      } else if (item.html && seen.size < cap) {
        for (const link of extractInternalLinks(item.html, item.meta.url, origin)) {
          if (!urlAllowed(link, applied)) continue;
          const n = normalizeUrl(link);
          inboundMap.set(n, (inboundMap.get(n) || 0) + 1);
          if (!seen.has(n) && seen.size < cap) {
            seen.add(n);
            depthMap.set(n, depth + 1);
            queued.push(n);
          }
        }
      }
    }
  }

  // Refresh inbound counts on results (links discovered after a page was scanned)
  for (const page of results) {
    const key = normalizeUrl(page.url);
    page.inboundLinks = inboundMap.get(key) || page.inboundLinks || 0;
  }

  const allDiscovered = prioritizeUrls(crawlEntry, Array.from(seen));
  const hitCap = seedHitCap || allDiscovered.length >= cap || results.length >= cap;

  return {
    pages: results,
    urlsToScan: allDiscovered,
    allDiscovered,
    totalFound: results.length,
    hitCap,
    controlsApplied: applied,
  };
}

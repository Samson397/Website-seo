import * as cheerio from "cheerio";
import { safeFetch, safeFetchText } from "@/lib/fetcher";

export interface CrawledPageMeta {
  url: string;
  title: string;
  description: string;
  h1: string;
  status: number;
}

/**
 * Hard cap on unique URLs we discover AND deep-scan.
 * Every discovered page is scanned — we do not list pages without scanning them.
 */
export const MAX_PAGES = 200;

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
        // Skip obvious non-HTML assets
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

export async function discoverPages(entryUrl: string, html: string): Promise<DiscoverResult> {
  const origin = new URL(entryUrl).origin;
  const discovered = new Set<string>();
  discovered.add(normalizeUrl(entryUrl));

  for (const url of await collectSitemapUrls(entryUrl, MAX_PAGES)) {
    discovered.add(normalizeUrl(url));
    if (discovered.size >= MAX_PAGES) break;
  }

  for (const link of extractInternalLinks(html, entryUrl, origin)) {
    discovered.add(normalizeUrl(link));
    if (discovered.size >= MAX_PAGES) break;
  }

  const allDiscovered = prioritizeUrls(entryUrl, normalizeUrls(Array.from(discovered)));
  const totalFound = allDiscovered.length;
  const hitCap = totalFound >= MAX_PAGES;

  return {
    urlsToScan: allDiscovered,
    allDiscovered,
    totalFound,
    hitCap,
  };
}

export function extractMetaFromHtml(url: string, html: string, status: number): CrawledPageMeta {
  const $ = cheerio.load(html);
  return {
    url,
    title: $("title").first().text().trim() || "(no title)",
    description: $('meta[name="description"]').attr("content")?.trim() || "",
    h1: $("h1").first().text().trim() || "",
    status,
  };
}

export async function fetchPageMeta(url: string): Promise<{
  meta: CrawledPageMeta;
  html?: string;
} | null> {
  try {
    const result = await safeFetch(url);
    if (!result.html) {
      return {
        meta: {
          url: result.finalUrl,
          title: "(no content)",
          description: "",
          h1: "",
          status: result.status,
        },
      };
    }
    return {
      meta: extractMetaFromHtml(result.finalUrl, result.html, result.status),
      html: result.html,
    };
  } catch {
    return null;
  }
}

/**
 * Discover pages from sitemap + links, then deep-scan every discovered URL.
 * Uses BFS link expansion while under the page cap so nested pages are not missed.
 */
export async function crawlSitePages(
  entryUrl: string,
  entryHtml: string
): Promise<{
  pages: CrawledPageMeta[];
  urlsToScan: string[];
  allDiscovered: string[];
  totalFound: number;
  hitCap: boolean;
}> {
  const origin = new URL(entryUrl).origin;
  const { urlsToScan: seedUrls, hitCap: seedHitCap } = await discoverPages(entryUrl, entryHtml);

  const queued = prioritizeUrls(entryUrl, seedUrls);
  const seen = new Set(queued.map(normalizeUrl));
  const results: CrawledPageMeta[] = [];
  const scanned = new Set<string>();

  let cursor = 0;
  const batchSize = 10;

  while (cursor < queued.length && results.length < MAX_PAGES) {
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
      results.push(item.meta);

      // BFS: pull more internal links from scanned HTML while under cap
      if (item.html && seen.size < MAX_PAGES) {
        for (const link of extractInternalLinks(item.html, item.meta.url, origin)) {
          const n = normalizeUrl(link);
          if (!seen.has(n) && seen.size < MAX_PAGES) {
            seen.add(n);
            queued.push(n);
          }
        }
      }
    }
  }

  const allDiscovered = prioritizeUrls(entryUrl, Array.from(seen));
  const hitCap = seedHitCap || allDiscovered.length >= MAX_PAGES;

  return {
    pages: results,
    urlsToScan: allDiscovered,
    allDiscovered,
    totalFound: results.length,
    hitCap,
  };
}

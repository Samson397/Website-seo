import * as cheerio from "cheerio";
import { safeFetch, safeFetchText } from "@/lib/fetcher";

export interface CrawledPageMeta {
  url: string;
  title: string;
  description: string;
  h1: string;
  status: number;
}

/** Max pages we deep-scan for meta / duplicate checks (no user picker). */
export const AUTO_SCAN_MAX = 75;
/** Max unique URLs to discover from sitemap + links. */
export const MAX_DISCOVER = 500;

export interface DiscoverResult {
  urlsToScan: string[];
  allDiscovered: string[];
  totalFound: number;
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
      const childSitemaps = parseSitemapUrls(xml, origin, 20).filter((u) => /\.xml$/i.test(u));
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
        resolved.hash = "";
        links.add(resolved.href);
      }
    } catch {
      // skip
    }
  });

  return Array.from(links);
}

function normalizeUrls(urls: string[]): string[] {
  return urls
    .map((u) => {
      try {
        const p = new URL(u);
        p.hash = "";
        return p.href.replace(/\/$/, "") || p.href;
      } catch {
        return u;
      }
    })
    .filter((u, i, arr) => arr.indexOf(u) === i);
}

function prioritizeUrls(entryUrl: string, urls: string[]): string[] {
  const entryNormalized = entryUrl.replace(/\/$/, "") || entryUrl;
  const entry =
    urls.find((u) => u === entryNormalized || u.startsWith(entryNormalized)) || urls[0];
  const rest = urls.filter((u) => u !== entry);
  return entry ? [entry, ...rest] : rest;
}

export async function discoverPages(entryUrl: string, html: string): Promise<DiscoverResult> {
  const origin = new URL(entryUrl).origin;
  const discovered = new Set<string>();
  discovered.add(entryUrl);

  for (const url of await collectSitemapUrls(entryUrl, MAX_DISCOVER)) {
    discovered.add(url);
    if (discovered.size >= MAX_DISCOVER) break;
  }

  for (const link of extractInternalLinks(html, entryUrl, origin)) {
    discovered.add(link);
    if (discovered.size >= MAX_DISCOVER) break;
  }

  const allDiscovered = prioritizeUrls(entryUrl, normalizeUrls(Array.from(discovered)));
  const totalFound = allDiscovered.length;
  const urlsToScan = allDiscovered.slice(0, AUTO_SCAN_MAX);

  return { urlsToScan, allDiscovered, totalFound };
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

export async function fetchPageMeta(url: string): Promise<CrawledPageMeta | null> {
  try {
    const result = await safeFetch(url);
    if (!result.html) {
      return {
        url: result.finalUrl,
        title: "(no content)",
        description: "",
        h1: "",
        status: result.status,
      };
    }
    return extractMetaFromHtml(result.finalUrl, result.html, result.status);
  } catch {
    return null;
  }
}

export async function crawlSitePages(
  entryUrl: string,
  entryHtml: string
): Promise<{
  pages: CrawledPageMeta[];
  urlsToScan: string[];
  allDiscovered: string[];
  totalFound: number;
}> {
  const { urlsToScan, allDiscovered, totalFound } = await discoverPages(entryUrl, entryHtml);
  const results: CrawledPageMeta[] = [];

  const batchSize = 6;
  for (let i = 0; i < urlsToScan.length; i += batchSize) {
    const batch = urlsToScan.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((u) => fetchPageMeta(u)));
    for (const meta of batchResults) {
      if (meta) results.push(meta);
    }
  }

  return { pages: results, urlsToScan, allDiscovered, totalFound };
}

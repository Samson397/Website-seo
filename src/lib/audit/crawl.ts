import * as cheerio from "cheerio";
import { safeFetch, safeFetchText } from "@/lib/fetcher";

export interface CrawledPageMeta {
  url: string;
  title: string;
  description: string;
  h1: string;
  status: number;
}

export const DEFAULT_MAX_PAGES = 10;
export const MAX_CRAWL_LIMIT = 30;
const MAX_DISCOVER_LIST = 250;

export interface DiscoverResult {
  urlsToScan: string[];
  totalFound: number;
  notScannedSample: string[];
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

export async function discoverPages(
  entryUrl: string,
  html: string,
  maxPages: number = DEFAULT_MAX_PAGES
): Promise<DiscoverResult> {
  const origin = new URL(entryUrl).origin;
  const discovered = new Set<string>();
  discovered.add(entryUrl);

  const sitemapXml = await safeFetchText("/sitemap.xml", entryUrl);
  if (sitemapXml) {
    for (const url of parseSitemapUrls(sitemapXml, origin, MAX_DISCOVER_LIST)) {
      discovered.add(url);
      if (discovered.size >= MAX_DISCOVER_LIST) break;
    }
  }

  for (const link of extractInternalLinks(html, entryUrl, origin)) {
    discovered.add(link);
    if (discovered.size >= MAX_DISCOVER_LIST) break;
  }

  const normalized = normalizeUrls(Array.from(discovered));
  const totalFound = normalized.length;

  const entryNormalized = entryUrl.replace(/\/$/, "") || entryUrl;
  const entry =
    normalized.find((u) => u === entryNormalized || u.startsWith(entryNormalized)) ||
    normalized[0];
  const rest = normalized.filter((u) => u !== entry);
  const urlsToScan = [entry, ...rest].slice(0, maxPages);

  const scanSet = new Set(urlsToScan);
  const notScannedSample = normalized
    .filter((u) => !scanSet.has(u))
    .slice(0, 8)
    .map((u) => {
      try {
        return new URL(u).pathname || "/";
      } catch {
        return u;
      }
    });

  return { urlsToScan, totalFound, notScannedSample };
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
  entryHtml: string,
  maxPages: number = DEFAULT_MAX_PAGES
): Promise<{
  pages: CrawledPageMeta[];
  urlsToScan: string[];
  totalFound: number;
  notScannedSample: string[];
}> {
  const { urlsToScan, totalFound, notScannedSample } = await discoverPages(
    entryUrl,
    entryHtml,
    maxPages
  );
  const results: CrawledPageMeta[] = [];

  const batchSize = 4;
  for (let i = 0; i < urlsToScan.length; i += batchSize) {
    const batch = urlsToScan.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((u) => fetchPageMeta(u)));
    for (const meta of batchResults) {
      if (meta) results.push(meta);
    }
  }

  return { pages: results, urlsToScan, totalFound, notScannedSample };
}

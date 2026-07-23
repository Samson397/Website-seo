import * as cheerio from "cheerio";
import { safeHead } from "@/lib/fetcher";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const LINK_CHECK_CONCURRENCY = 10;
const LINK_CHECK_TIME_BUDGET_MS = 25_000;

async function checkLinks(
  links: string[]
): Promise<{ brokenLinks: { url: string; status: number }[]; checkedCount: number }> {
  const brokenLinks: { url: string; status: number }[] = [];
  const startedAt = Date.now();
  let checkedCount = 0;

  for (let i = 0; i < links.length; i += LINK_CHECK_CONCURRENCY) {
    if (Date.now() - startedAt >= LINK_CHECK_TIME_BUDGET_MS) {
      break;
    }

    const batch = links.slice(i, i + LINK_CHECK_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (linkUrl) => {
        try {
          const result = await safeHead(linkUrl);
          if (result.status === 0 || result.status >= 400) {
            return { url: linkUrl, status: result.status === 0 ? 0 : result.status };
          }
        } catch {
          return { url: linkUrl, status: 0 };
        }
        return null;
      })
    );

    for (const broken of batchResults) {
      if (broken) brokenLinks.push(broken);
    }
    checkedCount += batch.length;
  }

  return { brokenLinks, checkedCount };
}

export async function runLinksAudit(ctx: AuditContext): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);
  const baseUrl = ctx.fetchResult.finalUrl;
  const baseOrigin = new URL(baseUrl).origin;

  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }
    try {
      const resolved = new URL(href, baseUrl).href;
      links.add(resolved);
    } catch {
      // skip invalid URLs
    }
  });

  const sortedLinks = Array.from(links).sort((a, b) => {
    const aInternal = a.startsWith(baseOrigin);
    const bInternal = b.startsWith(baseOrigin);
    if (aInternal === bInternal) return a.localeCompare(b);
    return aInternal ? -1 : 1;
  });

  const { brokenLinks, checkedCount } = await checkLinks(sortedLinks);

  for (const broken of brokenLinks) {
    const isInternal = broken.url.startsWith(baseOrigin);
    issues.push(
      createIssue({
        category: "links",
        severity: broken.status === 404 ? "critical" : "warning",
        title: broken.status === 0 ? "Broken link (unreachable)" : `Broken link (HTTP ${broken.status})`,
        description: isInternal
          ? "Internal broken links hurt user experience and waste crawl budget."
          : "External broken links reduce trust and may indicate outdated content.",
        currentValue: broken.url,
        recommendation: isInternal
          ? "Fix or remove the broken internal link."
          : "Update or remove the broken external link.",
      })
    );
  }

  if (checkedCount < links.size) {
    issues.push(
      createIssue({
        category: "links",
        severity: "info",
        title: "Additional links not checked",
        description: `Found ${links.size} links and checked ${checkedCount} before reaching the scan time limit. Internal links are checked first.`,
        currentValue: `${checkedCount} of ${links.size} links checked`,
        recommendation: "Run a full-site crawl tool for comprehensive link checking.",
      })
    );
  }

  if (links.size === 0) {
    issues.push(
      createIssue({
        category: "links",
        severity: "info",
        title: "No links found on page",
        description: "Pages with no outbound or internal links may be harder for crawlers to discover related content.",
        recommendation: "Add relevant internal links to help users and search engines navigate.",
      })
    );
  }

  return issues;
}

const CRAWL_LINK_SAMPLE_CAP = 40;
const CRAWL_LINK_BUDGET_MS = 15_000;

/**
 * Sample outbound links collected during the crawl (beyond the entry URL)
 * and HEAD-check them under a short budget.
 */
export async function runCrawlBrokenLinksAudit(
  pages: { url: string; outboundSample?: string[] }[],
  entryUrl: string
): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  if (pages.length < 2) return issues;

  let entryNorm = entryUrl;
  try {
    entryNorm = new URL(entryUrl).href.replace(/\/$/, "") || entryUrl;
  } catch {
    // keep
  }

  const candidates = new Set<string>();
  for (const page of pages) {
    let pageNorm = page.url;
    try {
      pageNorm = new URL(page.url).href.replace(/\/$/, "") || page.url;
    } catch {
      // keep
    }
    // Prefer links discovered on non-entry pages (entry already checked in runLinksAudit)
    if (pageNorm === entryNorm) continue;
    for (const link of page.outboundSample || []) {
      candidates.add(link);
      if (candidates.size >= CRAWL_LINK_SAMPLE_CAP) break;
    }
    if (candidates.size >= CRAWL_LINK_SAMPLE_CAP) break;
  }

  if (candidates.size === 0) return issues;

  const sorted = Array.from(candidates);
  const { brokenLinks, checkedCount } = await checkLinksWithBudget(
    sorted,
    CRAWL_LINK_BUDGET_MS
  );

  for (const broken of brokenLinks.slice(0, 15)) {
    issues.push(
      createIssue({
        category: "links",
        severity: broken.status === 404 ? "critical" : "warning",
        title:
          broken.status === 0
            ? "Broken link on crawled page (unreachable)"
            : `Broken link on crawled page (HTTP ${broken.status})`,
        description:
          "This URL was linked from an interior crawled page and failed a HEAD check.",
        currentValue: broken.url,
        recommendation: "Fix or remove the broken link on the template that references it.",
      })
    );
  }

  if (brokenLinks.length === 0 && checkedCount > 0) {
    // healthy sample — no issue
  } else if (checkedCount < sorted.length) {
    issues.push(
      createIssue({
        category: "links",
        severity: "info",
        title: "Crawl link sample incomplete",
        description: `Checked ${checkedCount} of ${sorted.length} sampled interior links before the time budget.`,
        currentValue: `${checkedCount}/${sorted.length}`,
        recommendation: "Re-scan key sections if you need deeper broken-link coverage.",
      })
    );
  }

  return issues;
}

async function checkLinksWithBudget(
  links: string[],
  budgetMs: number
): Promise<{ brokenLinks: { url: string; status: number }[]; checkedCount: number }> {
  const brokenLinks: { url: string; status: number }[] = [];
  const startedAt = Date.now();
  let checkedCount = 0;

  for (let i = 0; i < links.length; i += LINK_CHECK_CONCURRENCY) {
    if (Date.now() - startedAt >= budgetMs) break;
    const batch = links.slice(i, i + LINK_CHECK_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (linkUrl) => {
        try {
          const result = await safeHead(linkUrl);
          if (result.status === 0 || result.status >= 400) {
            return { url: linkUrl, status: result.status === 0 ? 0 : result.status };
          }
        } catch {
          return { url: linkUrl, status: 0 };
        }
        return null;
      })
    );
    for (const broken of batchResults) {
      if (broken) brokenLinks.push(broken);
    }
    checkedCount += batch.length;
  }

  return { brokenLinks, checkedCount };
}

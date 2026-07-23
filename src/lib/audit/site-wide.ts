import * as cheerio from "cheerio";
import { CrawledPageMeta } from "@/lib/audit/crawl";
import { pathToTemplate } from "@/lib/issue-groups";
import { AuditIssue, CrawlCoverage, createIssue } from "@/lib/types";

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

/** Prefer unique pathnames when judging duplicates (ignore tracking query variants). */
function uniqueByPathname(pages: CrawledPageMeta[]): CrawledPageMeta[] {
  return Array.from(new Map(pages.map((p) => [pathnameOf(p.url), p])).values());
}

function isIndexableHtmlPage(page: CrawledPageMeta): boolean {
  const path = pathnameOf(page.url);
  if (path.startsWith("/.well-known/")) return false;
  if (/\.(txt|xml|json|webmanifest)$/i.test(path)) return false;
  return page.status < 400;
}

function withPath(issue: Omit<AuditIssue, "id">, path?: string): Omit<AuditIssue, "id"> {
  if (!path) return issue;
  return {
    ...issue,
    pagePath: path,
    pathTemplate: pathToTemplate(path),
  };
}

export function runDuplicateMetaAudit(pages: CrawledPageMeta[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (pages.length < 2) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Site-wide duplicate check limited",
        description:
          "Only one page was scanned. Enable full site crawl or add a sitemap to check for duplicate titles/descriptions across pages.",
        recommendation: "Use full site scan to audit multiple pages.",
      })
    );
    return issues;
  }

  const htmlPages = pages.filter(isIndexableHtmlPage);

  const titleGroups = groupBy(
    htmlPages.filter((p) => p.title && p.title !== "(no title)"),
    (p) => p.title.toLowerCase()
  );

  for (const [title, group] of Array.from(titleGroups.entries())) {
    const unique = uniqueByPathname(group);
    if (unique.length > 1) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "critical",
          title: "Duplicate page titles found",
          description:
            "Multiple pages share the same title. Search engines may struggle to rank the correct page.",
          currentValue: `"${title}" used on ${unique.length} pages: ${unique.map((p) => pathnameOf(p.url)).join(", ")}`,
          recommendation: "Give each page a unique, descriptive title tag.",
          pagePath: pathnameOf(unique[0].url),
          pathTemplate: pathToTemplate(pathnameOf(unique[0].url)),
        })
      );
    }
  }

  const descGroups = groupBy(
    htmlPages.filter((p) => p.description.length > 20),
    (p) => p.description.toLowerCase()
  );

  for (const [, group] of Array.from(descGroups.entries())) {
    const unique = uniqueByPathname(group);
    if (unique.length > 1) {
      const preview = unique[0].description.substring(0, 80);
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Duplicate meta descriptions found",
          description:
            "Multiple pages share the same meta description, reducing their uniqueness in search results.",
          currentValue: `"${preview}..." on ${unique.length} pages: ${unique.map((p) => pathnameOf(p.url)).join(", ")}`,
          recommendation: "Write unique meta descriptions for each page.",
          pagePath: pathnameOf(unique[0].url),
          pathTemplate: pathToTemplate(pathnameOf(unique[0].url)),
        })
      );
    }
  }

  const emptyDesc = htmlPages.filter((p) => !p.description);
  if (emptyDesc.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Pages missing meta descriptions",
        description: `${emptyDesc.length} of ${htmlPages.length} scanned pages have no meta description.`,
        currentValue: emptyDesc.map((p) => pathnameOf(p.url)).join(", "),
        recommendation: "Add unique meta descriptions to every indexable page.",
      })
    );
  }

  const emptyH1 = htmlPages.filter((p) => !p.h1);
  if (emptyH1.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Pages missing H1 headings",
        description: `${emptyH1.length} scanned page(s) have no H1 heading.`,
        currentValue: emptyH1.map((p) => pathnameOf(p.url)).join(", "),
        recommendation: "Add a unique H1 to each page.",
      })
    );
  }

  const h1Groups = groupBy(
    htmlPages.filter((p) => p.h1 && p.h1.length > 2),
    (p) => p.h1.toLowerCase()
  );
  for (const [h1, group] of Array.from(h1Groups.entries())) {
    const unique = uniqueByPathname(group);
    if (unique.length > 1) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Duplicate H1 headings across pages",
          description:
            "Multiple pages share the same H1. That often signals thin templates or copied titles.",
          currentValue: `"${h1.slice(0, 80)}" on ${unique.length} pages: ${unique
            .map((p) => pathnameOf(p.url))
            .slice(0, 6)
            .join(", ")}`,
          recommendation: "Give each indexable page a unique, descriptive H1.",
          pagePath: pathnameOf(unique[0].url),
          pathTemplate: pathToTemplate(pathnameOf(unique[0].url)),
        })
      );
    }
  }

  const errorPages = pages.filter((p) => p.status >= 400);
  for (const page of errorPages) {
    issues.push(
      createIssue(
        withPath(
          {
            category: "links",
            severity: "critical",
            title: `Page returns HTTP ${page.status}`,
            description: "Pages returning errors cannot be indexed and hurt site quality.",
            currentValue: page.url,
            recommendation: "Fix the error or set up a 301 redirect to a valid page.",
          },
          pathnameOf(page.url)
        )
      )
    );
  }

  return issues;
}

export function runInternalLinkAudit(
  homepageHtml: string,
  entryUrl: string,
  crawledUrls: string[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const origin = new URL(entryUrl).origin;

  const homepageLinks = new Set<string>();
  const $ = cheerio.load(homepageHtml);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    try {
      const resolved = new URL(href, entryUrl);
      if (resolved.origin === origin) {
        homepageLinks.add(resolved.href.replace(/\/$/, "") || resolved.href);
      }
    } catch {
      // skip
    }
  });

  const unlinked = crawledUrls.filter((u) => {
    const normalized = u.replace(/\/$/, "") || u;
    const entry = entryUrl.replace(/\/$/, "") || entryUrl;
    if (normalized === entry) return false;
    return !homepageLinks.has(normalized);
  });

  if (unlinked.length > 0 && crawledUrls.length > 2) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Pages not linked from homepage",
        description:
          "These pages exist in your sitemap or site but aren't linked from the homepage, making them harder for crawlers and users to discover.",
        currentValue:
          unlinked
            .slice(0, 5)
            .map((u) => pathnameOf(u))
            .join(", ") + (unlinked.length > 5 ? ` (+${unlinked.length - 5} more)` : ""),
        recommendation: "Add internal links from the homepage or main navigation to important pages.",
      })
    );
  }

  return issues;
}

/** Orphan-ish pages (0 inbound in crawl graph) + deep pages. */
export function runLinkDepthAudit(pages: CrawledPageMeta[], entryUrl: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if (pages.length < 3) return issues;

  const entryNorm = entryUrl.replace(/\/$/, "") || entryUrl;
  const orphans = pages.filter((p) => {
    const norm = p.url.replace(/\/$/, "") || p.url;
    if (norm === entryNorm) return false;
    return (p.inboundLinks ?? 0) === 0;
  });

  if (orphans.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: orphans.length > 5 ? "warning" : "info",
        title: `${orphans.length} orphan-ish page${orphans.length === 1 ? "" : "s"} (no inbound links in crawl)`,
        description:
          "These URLs were discovered (often via sitemap) but no other crawled page linked to them. They may be hard for users and crawlers to find.",
        currentValue:
          orphans
            .slice(0, 8)
            .map((p) => pathnameOf(p.url))
            .join(", ") + (orphans.length > 8 ? ` (+${orphans.length - 8} more)` : ""),
        recommendation:
          "Add internal links from related content or navigation, or remove stale sitemap entries.",
      })
    );
  }

  const deep = pages.filter((p) => (p.depth ?? 0) >= 4);
  if (deep.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: `${deep.length} page${deep.length === 1 ? "" : "s"} at crawl depth 4+`,
        description:
          "Pages that sit deep in the internal link graph often get less crawl attention and weaker link equity.",
        currentValue:
          deep
            .slice(0, 8)
            .map((p) => `${pathnameOf(p.url)} (depth ${p.depth})`)
            .join(", ") + (deep.length > 8 ? ` (+${deep.length - 8} more)` : ""),
        recommendation: "Shorten paths with hub pages, breadcrumbs, and contextual internal links.",
      })
    );
  }

  return issues;
}

/** Site-wide redirect, canonical, and hreflang coverage signals. */
export function runCoverageAudit(pages: CrawledPageMeta[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if (pages.length === 0) return issues;

  const redirected = pages.filter((p) => p.redirected);
  if (redirected.length > 0) {
    issues.push(
      createIssue({
        category: "links",
        severity: redirected.length > 3 ? "warning" : "info",
        title: `${redirected.length} crawled URL${redirected.length === 1 ? "" : "s"} redirect`,
        description:
          "These discovered URLs landed on a different final URL. Prefer linking directly to the final destination.",
        currentValue:
          redirected
            .slice(0, 6)
            .map((p) => `${pathnameOf(p.requestedUrl || p.url)} → ${pathnameOf(p.finalUrl || p.url)}`)
            .join("; ") + (redirected.length > 6 ? ` (+${redirected.length - 6} more)` : ""),
        recommendation: "Update internal links and sitemap entries to the final URL (avoid chains).",
      })
    );
  }

  const missingCanonical = pages.filter(
    (p) => !p.canonical && p.status < 400 && isIndexableHtmlPage(p)
  );
  const withCanonical = pages.filter((p) => p.canonical && p.status < 400 && isIndexableHtmlPage(p));
  const badCanonical: CrawledPageMeta[] = [];
  for (const p of withCanonical) {
    try {
      const canon = new URL(p.canonical!, p.url);
      const self = new URL(p.url);
      if (canon.origin === self.origin && normalizeLoose(canon.href) !== normalizeLoose(self.href)) {
        // cross-page canonical is ok for duplicates; flag only empty-ish mismatches later
      }
      if (canon.protocol !== "http:" && canon.protocol !== "https:") {
        badCanonical.push(p);
      }
    } catch {
      badCanonical.push(p);
    }
  }

  if (missingCanonical.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: missingCanonical.length > 5 ? "warning" : "info",
        title: `Canonical coverage: ${missingCanonical.length} page${missingCanonical.length === 1 ? "" : "s"} missing`,
        description: `${withCanonical.length} of ${pages.length} pages have a canonical tag.`,
        currentValue: missingCanonical
          .slice(0, 10)
          .map((p) => pathnameOf(p.url))
          .join(", "),
        recommendation: "Add a self-referencing canonical on every indexable page.",
      })
    );
  }

  if (badCanonical.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: `${badCanonical.length} invalid canonical URL${badCanonical.length === 1 ? "" : "s"}`,
        description: "Canonical tags must be absolute http(s) URLs.",
        currentValue: badCanonical
          .slice(0, 6)
          .map((p) => `${pathnameOf(p.url)} → ${p.canonical}`)
          .join("; "),
        recommendation: "Use absolute https:// canonical URLs that resolve to the preferred page.",
      })
    );
  }

  // Non-self canonicals: pages that point at a different same-origin URL (clusters / conflicts)
  const nonSelf: { page: CrawledPageMeta; target: string }[] = [];
  const targetCounts = new Map<string, number>();
  for (const p of withCanonical) {
    if (p.status >= 400) continue;
    try {
      const canon = normalizeLoose(new URL(p.canonical!, p.url).href);
      const self = normalizeLoose(p.url);
      if (canon !== self) {
        nonSelf.push({ page: p, target: canon });
        targetCounts.set(canon, (targetCounts.get(canon) || 0) + 1);
      }
    } catch {
      // already handled as badCanonical
    }
  }

  if (nonSelf.length > 0) {
    const clustered = Array.from(targetCounts.entries()).filter(([, n]) => n >= 2);
    issues.push(
      createIssue({
        category: "seo",
        severity: clustered.length > 0 || nonSelf.length > 3 ? "warning" : "info",
        title: `${nonSelf.length} page${nonSelf.length === 1 ? "" : "s"} with non-self canonical`,
        description:
          clustered.length > 0
            ? "Several URLs canonicalize to the same target — confirm these are intentional duplicates, not conflicting preferences."
            : "These pages declare a canonical that is not the page URL itself. That is fine for true duplicates; risky if unintended.",
        currentValue:
          nonSelf
            .slice(0, 8)
            .map(({ page, target }) => `${pathnameOf(page.url)} → ${pathnameOf(target)}`)
            .join("; ") + (nonSelf.length > 8 ? ` (+${nonSelf.length - 8} more)` : ""),
        recommendation:
          "Use self-referencing canonicals on indexable pages. Only cross-canonicalize true duplicates to one preferred URL.",
      })
    );
  }

  const withHreflang = pages.filter((p) => (p.hreflang?.length ?? 0) > 0);
  const withoutHreflang = pages.filter((p) => (p.hreflang?.length ?? 0) === 0 && p.status < 400);
  if (withHreflang.length > 0 && withoutHreflang.length > 0 && pages.length > 2) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: `Hreflang coverage uneven (${withHreflang.length}/${pages.length} pages)`,
        description:
          "Some pages declare hreflang alternates while others do not. Incomplete sets confuse international targeting.",
        currentValue: `Missing on: ${withoutHreflang
          .slice(0, 8)
          .map((p) => pathnameOf(p.url))
          .join(", ")}`,
        recommendation:
          "Add reciprocal hreflang (including x-default) on every language/region variant, or remove partial tags.",
      })
    );
  } else if (withHreflang.length === 0 && pages.length > 3) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No hreflang tags found in crawl",
        description:
          "If you serve multiple languages or regions, hreflang helps search engines show the right version.",
        recommendation:
          "Add hreflang only when you have true language/region variants; skip for single-locale sites.",
      })
    );
  }

  return issues;
}

function normalizeLoose(href: string): string {
  try {
    const u = new URL(href);
    u.hash = "";
    return u.href.replace(/\/$/, "") || u.href;
  } catch {
    return href;
  }
}

export function buildCrawlCoverage(pages: CrawledPageMeta[], entryUrl: string): CrawlCoverage {
  const entryNorm = entryUrl.replace(/\/$/, "") || entryUrl;
  const withCanonical = pages.filter((p) => Boolean(p.canonical)).length;
  const selfCanonical = pages.filter((p) => {
    if (!p.canonical) return false;
    try {
      return normalizeLoose(new URL(p.canonical, p.url).href) === normalizeLoose(p.url);
    } catch {
      return false;
    }
  }).length;
  const orphans = pages.filter((p) => {
    const norm = p.url.replace(/\/$/, "") || p.url;
    if (norm === entryNorm) return false;
    return (p.inboundLinks ?? 0) === 0;
  }).length;

  const depthCounts = new Map<number, number>();
  let maxDepth = 0;
  for (const p of pages) {
    const d = p.depth ?? 0;
    maxDepth = Math.max(maxDepth, d);
    depthCounts.set(d, (depthCounts.get(d) || 0) + 1);
  }

  return {
    withCanonical,
    missingCanonical: Math.max(0, pages.length - withCanonical),
    selfCanonical,
    redirected: pages.filter((p) => p.redirected).length,
    withHreflang: pages.filter((p) => (p.hreflang?.length ?? 0) > 0).length,
    orphans,
    maxDepth,
    byDepth: Array.from(depthCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([depth, count]) => ({ depth, count })),
  };
}

/** Light per-page signals collected while crawl HTML was in memory. */
export function runCrawlPageSignalAudit(pages: CrawledPageMeta[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if (pages.length < 2) return issues;

  const missingAltPages = pages.filter((p) => (p.missingAltCount ?? 0) > 0 && p.status < 400);
  const totalMissingAlt = missingAltPages.reduce((sum, p) => sum + (p.missingAltCount ?? 0), 0);
  if (totalMissingAlt > 0) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: totalMissingAlt > 10 ? "warning" : "info",
        title: `${totalMissingAlt} image${totalMissingAlt === 1 ? "" : "s"} missing alt across crawl`,
        description: `${missingAltPages.length} crawled page(s) include <img> tags without an alt attribute.`,
        currentValue:
          missingAltPages
            .slice(0, 8)
            .map((p) => `${pathnameOf(p.url)} (${p.missingAltCount})`)
            .join(", ") + (missingAltPages.length > 8 ? ` (+${missingAltPages.length - 8} more)` : ""),
        recommendation: "Add descriptive alt text (or alt=\"\" for decorative images) on every template.",
      })
    );
  }

  const noSchema = pages.filter(
    (p) => !p.hasJsonLd && p.status < 400 && (p.wordCount ?? 0) > 150
  );
  if (noSchema.length > 0 && pages.length >= 3) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: `${noSchema.length} content page${noSchema.length === 1 ? "" : "s"} without JSON-LD`,
        description:
          "These crawled pages have substantial copy but no structured data. Schema helps rich results and AI understanding.",
        currentValue: noSchema
          .slice(0, 10)
          .map((p) => pathnameOf(p.url))
          .join(", "),
        recommendation:
          "Add relevant JSON-LD (Article, FAQPage, Product, BreadcrumbList) on content templates.",
      })
    );
  }

  return issues;
}

import * as cheerio from "cheerio";
import { CrawledPageMeta } from "@/lib/audit/crawl";
import { AuditIssue, createIssue } from "@/lib/types";

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

  const titleGroups = groupBy(
    pages.filter((p) => p.title && p.title !== "(no title)"),
    (p) => p.title.toLowerCase()
  );

  for (const [title, group] of Array.from(titleGroups.entries())) {
    if (group.length > 1) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "critical",
          title: "Duplicate page titles found",
          description:
            "Multiple pages share the same title. Search engines may struggle to rank the correct page.",
          currentValue: `"${title}" used on ${group.length} pages: ${group.map((p) => new URL(p.url).pathname).join(", ")}`,
          recommendation: "Give each page a unique, descriptive title tag.",
        })
      );
    }
  }

  const descGroups = groupBy(
    pages.filter((p) => p.description.length > 20),
    (p) => p.description.toLowerCase()
  );

  for (const [, group] of Array.from(descGroups.entries())) {
    if (group.length > 1) {
      const preview = group[0].description.substring(0, 80);
      issues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: "Duplicate meta descriptions found",
          description:
            "Multiple pages share the same meta description, reducing their uniqueness in search results.",
          currentValue: `"${preview}..." on ${group.length} pages: ${group.map((p) => new URL(p.url).pathname).join(", ")}`,
          recommendation: "Write unique meta descriptions for each page.",
        })
      );
    }
  }

  const emptyDesc = pages.filter((p) => !p.description);
  if (emptyDesc.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Pages missing meta descriptions",
        description: `${emptyDesc.length} of ${pages.length} scanned pages have no meta description.`,
        currentValue: emptyDesc.map((p) => new URL(p.url).pathname).join(", "),
        recommendation: "Add unique meta descriptions to every indexable page.",
      })
    );
  }

  const emptyH1 = pages.filter((p) => !p.h1);
  if (emptyH1.length > 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Pages missing H1 headings",
        description: `${emptyH1.length} scanned page(s) have no H1 heading.`,
        currentValue: emptyH1.map((p) => new URL(p.url).pathname).join(", "),
        recommendation: "Add a unique H1 to each page.",
      })
    );
  }

  const errorPages = pages.filter((p) => p.status >= 400);
  for (const page of errorPages) {
    issues.push(
      createIssue({
        category: "links",
        severity: "critical",
        title: `Page returns HTTP ${page.status}`,
        description: "Pages returning errors cannot be indexed and hurt site quality.",
        currentValue: page.url,
        recommendation: "Fix the error or set up a 301 redirect to a valid page.",
      })
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
        currentValue: unlinked.slice(0, 5).map((u) => new URL(u).pathname).join(", ") +
          (unlinked.length > 5 ? ` (+${unlinked.length - 5} more)` : ""),
        recommendation: "Add internal links from the homepage or main navigation to important pages.",
      })
    );
  }

  return issues;
}

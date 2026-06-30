import * as cheerio from "cheerio";
import { safeHead } from "@/lib/fetcher";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const MAX_LINKS_TO_CHECK = 20;

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

  const linksToCheck = Array.from(links).slice(0, MAX_LINKS_TO_CHECK);
  const brokenLinks: { url: string; status: number }[] = [];

  await Promise.all(
    linksToCheck.map(async (linkUrl) => {
      try {
        const result = await safeHead(linkUrl);
        if (result.status === 0) {
          brokenLinks.push({ url: linkUrl, status: 0 });
        } else if (result.status >= 400) {
          brokenLinks.push({ url: linkUrl, status: result.status });
        }
      } catch {
        brokenLinks.push({ url: linkUrl, status: 0 });
      }
    })
  );

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

  if (links.size > MAX_LINKS_TO_CHECK) {
    issues.push(
      createIssue({
        category: "links",
        severity: "info",
        title: "Additional links not checked",
        description: `Found ${links.size} links but only checked the first ${MAX_LINKS_TO_CHECK} to avoid long scan times.`,
        currentValue: `${links.size} total links on page`,
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

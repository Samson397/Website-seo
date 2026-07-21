import type { AuditReport } from "@/lib/types";

export type OpportunityImpact = "high" | "medium" | "low";

export interface SeoOpportunity {
  id: string;
  title: string;
  why: string;
  action: string;
  impact: OpportunityImpact;
  category: "technical" | "content" | "visibility" | "authority" | "experience";
  sourceIssueIds?: string[];
}

function impactRank(impact: OpportunityImpact): number {
  return impact === "high" ? 0 : impact === "medium" ? 1 : 2;
}

/**
 * Deterministic SEO Agent opportunities from an audit report.
 * No API cost — works offline from crawl/issue data. AI can enrich later.
 */
export function buildSeoOpportunities(report: AuditReport): SeoOpportunity[] {
  const out: SeoOpportunity[] = [];
  const issues = report.issues || [];
  const byId = new Map(issues.map((i) => [i.id, i]));

  const pushFromIssue = (
    issueId: string,
    overrides: Partial<SeoOpportunity> & Pick<SeoOpportunity, "id" | "title" | "action" | "impact" | "category">
  ) => {
    const issue = byId.get(issueId) || issues.find((i) => i.id.includes(issueId) || i.title.toLowerCase().includes(issueId));
    if (!issue && !overrides.why) return;
    out.push({
      why: overrides.why || issue?.description || "Found in your SEOHub audit.",
      sourceIssueIds: issue ? [issue.id] : undefined,
      ...overrides,
    });
  };

  // Critical issues → high impact opportunities
  for (const issue of issues.filter((i) => i.severity === "critical").slice(0, 6)) {
    const category: SeoOpportunity["category"] =
      issue.category === "performance"
        ? "experience"
        : issue.category === "seo"
          ? "visibility"
          : issue.category === "links"
            ? "authority"
            : "technical";
    out.push({
      id: `issue-${issue.id}`,
      title: issue.title,
      why: issue.description,
      action: issue.recommendation,
      impact: "high",
      category,
      sourceIssueIds: [issue.id],
    });
  }

  // Homepage title / meta
  const titleIssue = issues.find((i) => /title/i.test(i.title) && i.severity !== "info");
  if (titleIssue) {
    pushFromIssue(titleIssue.id, {
      id: "fix-homepage-title",
      title: "Fix homepage title",
      action: titleIssue.recommendation,
      impact: "high",
      category: "visibility",
    });
  }

  const metaIssue = issues.find((i) => /meta description/i.test(i.title));
  if (metaIssue) {
    pushFromIssue(metaIssue.id, {
      id: "fix-meta-description",
      title: "Improve meta description",
      action: metaIssue.recommendation,
      impact: "medium",
      category: "visibility",
    });
  }

  // Crawl / orphan / duplicates
  if (report.crawl) {
    const orphanish = report.crawl.pages.filter((p) => (p.inboundLinks ?? 0) === 0 && p.pathname !== "/");
    if (orphanish.length > 0) {
      out.push({
        id: "orphan-pages",
        title: `Link ${Math.min(orphanish.length, 12)} weak / orphan pages`,
        why: `${orphanish.length} crawled page(s) have no inbound links in the crawl graph — search engines may under-discover them.`,
        action: `Add internal links from relevant hubs to: ${orphanish
          .slice(0, 5)
          .map((p) => p.pathname || p.url)
          .join(", ")}`,
        impact: orphanish.length >= 3 ? "high" : "medium",
        category: "technical",
      });
    }

    const titles = new Map<string, number>();
    for (const p of report.crawl.pages) {
      const t = (p.title || "").trim().toLowerCase();
      if (!t) continue;
      titles.set(t, (titles.get(t) || 0) + 1);
    }
    const dupTitles = Array.from(titles.entries()).filter(([, n]) => n > 1);
    if (dupTitles.length > 0) {
      out.push({
        id: "duplicate-titles",
        title: "Resolve duplicate titles",
        why: `${dupTitles.length} title(s) repeat across multiple URLs, diluting rankings.`,
        action: "Give each money page a unique title that includes its primary keyword.",
        impact: "high",
        category: "content",
      });
    }

    if (report.crawl.hitCap) {
      out.push({
        id: "crawl-budget",
        title: "Review crawl coverage / budget",
        why: `Scan hit the page cap (${report.crawl.pagesScanned} pages) — important URLs may be undiscovered.`,
        action: "Use crawl include/exclude paths, fix parameter sprawl, and prioritize money pages in the sitemap.",
        impact: "medium",
        category: "technical",
      });
    }
  }

  // Performance
  if (report.scores.performance < 60) {
    out.push({
      id: "improve-page-speed",
      title: "Improve page speed",
      why: `Performance score is ${report.scores.performance}/100 — Core Web Vitals and rankings can suffer.`,
      action: "Compress images, defer non-critical JS, and fix LCP/CLS issues from the performance findings.",
      impact: "high",
      category: "experience",
    });
  }

  // AI visibility
  if ((report.scores.ai ?? 100) < 55 || (report.aiVisibility && report.aiVisibility.score < 55)) {
    out.push({
      id: "ai-visibility",
      title: "Improve AI / GEO visibility",
      why: "AI crawlers or entity signals look weak — you may be invisible in AI answers.",
      action: "Allow major AI bots in robots.txt, add Organization/FAQ schema, and publish /llms.txt.",
      impact: "medium",
      category: "visibility",
    });
  }

  // Backlinks
  const backlinks = report.siteOverview?.backlinks;
  if (backlinks && (backlinks.referringDomains ?? 0) < 5) {
    out.push({
      id: "build-backlinks",
      title: "Build referring domains",
      why: `Only ${backlinks.referringDomains ?? 0} referring domain(s) detected — authority looks thin.`,
      action: "Earn links from local directories, partners, and pages that already link to competitors.",
      impact: "medium",
      category: "authority",
    });
  }

  // Content thin
  const thin = issues.find((i) => /thin|word count|content length/i.test(i.title));
  if (thin) {
    out.push({
      id: "expand-content",
      title: "Expand thin content",
      why: thin.description,
      action: thin.recommendation,
      impact: "medium",
      category: "content",
      sourceIssueIds: [thin.id],
    });
  }

  // Dedupe by id, sort by impact
  const seen = new Set<string>();
  return out
    .filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    })
    .sort((a, b) => impactRank(a.impact) - impactRank(b.impact))
    .slice(0, 10);
}

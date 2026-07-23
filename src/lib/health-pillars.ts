import type { AuditReport, SiteChecklist } from "@/lib/types";

export type HealthPillarId =
  | "crawlability"
  | "indexability"
  | "content"
  | "performance"
  | "mobile"
  | "security"
  | "structured"
  | "accessibility";

export interface HealthPillar {
  id: HealthPillarId;
  label: string;
  score: number;
  status: "strong" | "ok" | "weak";
  detail: string;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function statusFor(score: number): HealthPillar["status"] {
  if (score >= 85) return "strong";
  if (score >= 65) return "ok";
  return "weak";
}

function checklistSlice(
  checklist: SiteChecklist | undefined,
  ids: string[]
): { pass: number; total: number; score: number } {
  if (!checklist?.items?.length) return { pass: 0, total: 0, score: 70 };
  const items = checklist.items.filter((i) => ids.includes(i.id));
  if (items.length === 0) return { pass: 0, total: 0, score: 70 };
  const pass = items.filter((i) => i.status === "pass").length;
  const attention = items.filter((i) => i.status === "attention").length;
  const score = clamp(((pass + attention * 0.5) / items.length) * 100);
  return { pass, total: items.length, score };
}

function blend(a: number, b: number, aWeight = 0.55): number {
  return clamp(a * aWeight + b * (1 - aWeight));
}

/** Derive an 8-pillar health view from scores + checklist (no new crawl). */
export function buildHealthPillars(report: AuditReport): HealthPillar[] {
  const c = report.checklist;
  const s = report.scores;

  const crawl = checklistSlice(c, [
    "robots",
    "sitemap",
    "https",
    "www",
    "redirects",
    "compression",
  ]);
  const index = checklistSlice(c, [
    "indexable",
    "robots-meta",
    "canonical",
    "title",
    "description",
    "hreflang",
  ]);
  const content = checklistSlice(c, [
    "content",
    "h1",
    "h2",
    "alt",
    "images-ok",
    "links",
    "dates",
    "author",
  ]);
  const mobile = checklistSlice(c, ["viewport", "favicon", "apple-icon", "manifest"]);
  const structured = checklistSlice(c, [
    "schema",
    "schema-valid",
    "faq-schema",
    "org-schema",
    "breadcrumbs",
  ]);
  const securityChecks = checklistSlice(c, [
    "ssl",
    "hsts",
    "xfo",
    "xcto",
    "csp",
    "referrer",
    "permissions",
    "mixed",
    "security-txt",
  ]);
  const a11yChecks = checklistSlice(c, [
    "lang",
    "main-landmark",
    "skip",
    "forms",
    "buttons",
  ]);

  const pillars: HealthPillar[] = [
    {
      id: "crawlability",
      label: "Crawlability",
      score: crawl.score,
      status: statusFor(crawl.score),
      detail: crawl.total
        ? `${crawl.pass}/${crawl.total} crawl checks passing`
        : "Based on robots, sitemap, and host hygiene",
    },
    {
      id: "indexability",
      label: "Indexability",
      score: blend(index.score, s.seo, 0.6),
      status: statusFor(blend(index.score, s.seo, 0.6)),
      detail: "Canonicals, robots meta, and index signals",
    },
    {
      id: "content",
      label: "Content",
      score: content.score,
      status: statusFor(content.score),
      detail: content.total
        ? `${content.pass}/${content.total} content checks passing`
        : "Titles, headings, and on-page depth",
    },
    {
      id: "performance",
      label: "Performance",
      score: s.performance,
      status: statusFor(s.performance),
      detail: report.performanceMetrics?.lcp
        ? `Lab LCP ${report.performanceMetrics.lcp}`
        : "Speed score from PageSpeed + HTML heuristics",
    },
    {
      id: "mobile",
      label: "Mobile",
      score: mobile.score,
      status: statusFor(mobile.score),
      detail: "Viewport, icons, and installability signals",
    },
    {
      id: "security",
      label: "Security",
      score: blend(securityChecks.score, s.security, 0.45),
      status: statusFor(blend(securityChecks.score, s.security, 0.45)),
      detail: "HTTPS, headers, and mixed content",
    },
    {
      id: "structured",
      label: "Structured data",
      score: structured.score,
      status: statusFor(structured.score),
      detail: "JSON-LD presence and validity checks",
    },
    {
      id: "accessibility",
      label: "Accessibility",
      score: blend(a11yChecks.score, s.accessibility, 0.4),
      status: statusFor(blend(a11yChecks.score, s.accessibility, 0.4)),
      detail: "Landmarks, labels, and Lighthouse a11y when available",
    },
  ];

  return pillars;
}

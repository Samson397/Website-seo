import type { AuditReport } from "@/lib/types";
import type { CompetitorAuditResult } from "@/lib/competitor-scores";
import { overallScore } from "@/lib/competitor-scores";

export interface CompetitorGapRow {
  label: string;
  url: string;
  overall: number | null;
  title: string;
  description: string;
  titleLen: number;
  descriptionLen: number;
  h1: string;
  wordCount: number | null;
  critical: number;
  warning: number;
  topIssues: { severity: string; title: string }[];
  error?: string;
}

function homepageWordCount(report: AuditReport): number | null {
  const home = report.crawl?.pages?.find((p) => p.pathname === "/" || p.url === report.url);
  if (home?.wordCount != null) return home.wordCount;
  // Homepage-only audits often have no crawl — estimate from checklist/content signals unavailable
  return null;
}

function homepageH1(report: AuditReport): string {
  const home = report.crawl?.pages?.find((p) => p.pathname === "/" || p.url === report.url);
  if (home?.hasH1) {
    // title often mirrors H1 when crawl meta lacks h1 text
    return home.title || report.serpPreview?.title || "—";
  }
  const h1Issue = report.issues.find((i) => /h1/i.test(i.title) && i.currentValue);
  if (h1Issue?.currentValue) return h1Issue.currentValue;
  return report.serpPreview?.title || "—";
}

export function buildCompetitorGapRows(results: CompetitorAuditResult[]): CompetitorGapRow[] {
  return results.map((r) => {
    if (r.error || !r.report) {
      return {
        label: r.label,
        url: r.url,
        overall: null,
        title: "—",
        description: "—",
        titleLen: 0,
        descriptionLen: 0,
        h1: "—",
        wordCount: null,
        critical: 0,
        warning: 0,
        topIssues: [],
        error: r.error || "No report",
      };
    }
    const report = r.report;
    const title = report.serpPreview?.title || "—";
    const description = report.serpPreview?.description || "—";
    const topIssues = [...report.issues]
      .sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      })
      .slice(0, 5)
      .map((i) => ({ severity: i.severity, title: i.title }));

    return {
      label: r.label,
      url: report.url,
      overall: overallScore(report),
      title,
      description,
      titleLen: title === "—" ? 0 : title.length,
      descriptionLen: description === "—" ? 0 : description.length,
      h1: homepageH1(report),
      wordCount: homepageWordCount(report),
      critical: report.summary.critical,
      warning: report.summary.warning,
      topIssues,
    };
  });
}

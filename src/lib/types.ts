export type Severity = "critical" | "warning" | "info";

export type AuditCategory =
  | "seo"
  | "performance"
  | "accessibility"
  | "security"
  | "links";

export interface AuditIssue {
  id: string;
  category: AuditCategory;
  severity: Severity;
  title: string;
  description: string;
  currentValue?: string;
  recommendation: string;
  fixSnippet?: string;
}

export interface AuditScores {
  seo: number;
  performance: number;
  accessibility: number;
  security: number;
}

export interface AuditSummary {
  critical: number;
  warning: number;
  info: number;
}

export interface PerformanceMetrics {
  lcp?: string;
  cls?: string;
  inp?: string;
  fcp?: string;
  ttfb?: string;
}

export interface SerpPreview {
  title: string;
  description: string;
  url: string;
}

export interface PageSummary {
  url: string;
  pathname: string;
  title: string;
  description: string;
  hasH1: boolean;
  status: number;
}

export interface CrawlSummary {
  enabled: boolean;
  pagesScanned: number;
  pagesDiscovered: number;
  pages: PageSummary[];
}

export interface AuditOptions {
  siteCrawl?: boolean;
  maxPages?: number;
}

export interface AuditReport {
  url: string;
  scannedAt: string;
  scores: AuditScores;
  issues: AuditIssue[];
  summary: AuditSummary;
  performanceMetrics?: PerformanceMetrics;
  performanceNote?: string;
  serpPreview?: SerpPreview;
  crawl?: CrawlSummary;
}

export interface FetchResult {
  url: string;
  finalUrl: string;
  html: string;
  headers: Record<string, string>;
  status: number;
}

export interface AuditContext {
  url: string;
  fetchResult: FetchResult;
}

let issueCounter = 0;

export function createIssue(
  partial: Omit<AuditIssue, "id">
): AuditIssue {
  issueCounter += 1;
  return { id: `issue-${issueCounter}`, ...partial };
}

export function resetIssueCounter(): void {
  issueCounter = 0;
}

export function computeSummary(issues: AuditIssue[]): AuditSummary {
  return issues.reduce(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 }
  );
}

export function computeCategoryScore(
  issues: AuditIssue[],
  category: AuditCategory
): number {
  const categoryIssues = issues.filter((i) => i.category === category);
  if (categoryIssues.length === 0) return 100;

  const weights = { critical: 25, warning: 10, info: 3 };
  const penalty = categoryIssues.reduce(
    (sum, issue) => sum + weights[issue.severity],
    0
  );
  return Math.max(0, Math.min(100, 100 - penalty));
}

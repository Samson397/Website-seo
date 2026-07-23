export type Severity = "critical" | "warning" | "info";

export type AuditCategory =
  | "seo"
  | "performance"
  | "accessibility"
  | "security"
  | "links"
  | "domain";

export interface AuditIssue {
  id: string;
  category: AuditCategory;
  severity: Severity;
  title: string;
  description: string;
  currentValue?: string;
  recommendation: string;
  fixSnippet?: string;
  /** Pathname for URL-template grouping when known */
  pagePath?: string;
  /** Collapsed template e.g. /blog/:slug */
  pathTemplate?: string;
  /** Estimated SEO/business impact */
  impact?: "high" | "medium" | "low";
  /** How hard the fix usually is */
  difficulty?: "easy" | "medium" | "hard";
  /** Rough fix time for a typical site owner */
  timeEstimate?: string;
  /** User-facing priority bucket */
  priorityLabel?: "Critical" | "High" | "Medium" | "Low";
}

export interface AuditScores {
  seo: number;
  performance: number;
  accessibility: number;
  security: number;
  /** GEO / AI-assistant visibility (0–100 internal; show as /10) */
  ai: number;
}

export interface AiVisibilitySummary {
  score: number;
  signals: {
    id: string;
    label: string;
    status: "pass" | "fail" | "attention";
    detail: string;
  }[];
  botsAllowed: string[];
  botsBlocked: string[];
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
  /** Chrome UX Report (field) — when Google returns loadingExperience */
  fieldLcp?: string;
  fieldCls?: string;
  fieldInp?: string;
  fieldCategory?: string;
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
  canonical?: string;
  robots?: string;
  hasOg?: boolean;
  wordCount?: number;
  h1Count?: number;
  /** BFS depth from crawl start (0 = start URL) */
  depth?: number;
  /** Internal pages linking to this URL within the crawl */
  inboundLinks?: number;
  /** Requested URL differed from final URL after redirects */
  redirected?: boolean;
  finalUrl?: string;
  hreflangCount?: number;
}

export interface CrawlCoverage {
  withCanonical: number;
  missingCanonical: number;
  selfCanonical: number;
  redirected: number;
  withHreflang: number;
  orphans: number;
  maxDepth: number;
  byDepth: { depth: number; count: number }[];
}

export interface CrawlSummary {
  enabled: boolean;
  pagesScanned: number;
  /** Total unique pages found and scanned via sitemap + links + BFS */
  totalPagesFound: number;
  /** @deprecated use totalPagesFound — kept for older clients */
  pagesDiscovered: number;
  /** True when the site is larger than the scan cap */
  hitCap?: boolean;
  /** All scanned page paths */
  allPagePaths?: string[];
  pages: PageSummary[];
  /** Controls applied for this crawl */
  controls?: {
    maxPages: number;
    includePaths: string[];
    excludePaths: string[];
    startPath?: string;
  };
  coverage?: CrawlCoverage;
}

export interface SiteOverview {
  domain: {
    registrar?: string;
    created?: string;
    expires?: string;
    daysUntilExpiry?: number;
    nameservers?: string[];
  };
  dns: {
    mxRecords?: string[];
    hasSpf: boolean;
    hasDmarc: boolean;
    hasDkim: boolean;
    ipv4?: string[];
    ipv6?: string[];
  };
  ssl: {
    issuer?: string;
    validTo?: string;
    daysUntilExpiry?: number;
    protocol?: string;
  };
  technologies: { name: string; category: string }[];
  socialProfiles: { platform: string; url: string }[];
  externalLinks: {
    total: number;
    uniqueDomains: number;
    topDomains: { domain: string; count: number }[];
  };
  internalLinks: number;
  backlinks?: {
    available: boolean;
    totalBacklinks?: number;
    referringDomains?: number;
    dofollowBacklinks?: number;
    nofollowBacklinks?: number;
    domainRank?: number;
    topBacklinks?: {
      sourceUrl: string;
      sourceDomain: string;
      anchor?: string;
      dofollow: boolean;
    }[];
  };
}

export type CheckCategory =
  | "seo"
  | "content"
  | "technical"
  | "social"
  | "security"
  | "accessibility"
  | "trust"
  | "performance";

export interface SiteChecklist {
  passCount: number;
  failCount: number;
  attentionCount: number;
  /** @deprecated use passCount */
  hasCount: number;
  /** @deprecated use failCount */
  missingCount: number;
  /** @deprecated use attentionCount */
  warningCount: number;
  items: {
    id: string;
    label: string;
    status: "pass" | "fail" | "attention";
    category: CheckCategory;
    explanation: string;
    fixHint?: string;
  }[];
  summary: string;
}

export interface AuditOptions {
  /** Homepage-only when false (competitors). Default true. */
  siteCrawl?: boolean;
  /** Cap unique pages (1–200). */
  maxPages?: number;
  /** Only include matching path prefixes/globs. */
  includePaths?: string[];
  /** Exclude matching path prefixes/globs. */
  excludePaths?: string[];
  /** Start crawl at this path on the same origin. */
  startPath?: string;
  /** Optional progress callbacks for streaming UI */
  onProgress?: (event: Exclude<ScanProgressEvent, { type: "done" } | { type: "error" }>) => void;
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
  siteOverview?: SiteOverview;
  checklist?: SiteChecklist;
  /** AI / GEO visibility breakdown */
  aiVisibility?: AiVisibilitySummary;
  /** Present when the report was saved for sharing */
  shareId?: string;
  /** Server-side stash id for unlock-in-place (free preview → paid without re-scan) */
  previewId?: string;
  /** free = homepage preview; full = paid unlock (when Stripe is configured) */
  tier?: "free" | "full" | "compare";
}

export type ScanProgressEvent =
  | { type: "stage"; stage: string; message: string }
  | { type: "crawl"; scanned: number; queued: number; lastPath?: string }
  | { type: "done"; report: AuditReport }
  | { type: "error"; error: string };

export interface FetchResult {
  url: string;
  finalUrl: string;
  html: string;
  headers: Record<string, string>;
  status: number;
  responseTimeMs?: number;
  htmlSizeBytes?: number;
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

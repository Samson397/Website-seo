import { safeFetch } from "@/lib/fetcher";
import { runSeoAudit } from "@/lib/audit/seo";
import { runAccessibilityAudit } from "@/lib/audit/accessibility";
import { runSecurityAudit } from "@/lib/audit/security";
import { runLinksAudit } from "@/lib/audit/links";
import { runPerformanceAudit } from "@/lib/audit/performance";
import { runContentAudit, extractPageMeta } from "@/lib/audit/content";
import { runImageAudit } from "@/lib/audit/images";
import { runMobileSocialAudit } from "@/lib/audit/mobile-social";
import { crawlSitePages } from "@/lib/audit/crawl";
import { runDuplicateMetaAudit, runInternalLinkAudit } from "@/lib/audit/site-wide";
import { runTrustAudit, runModernWebAudit, runWwwConsistencyAudit } from "@/lib/audit/trust";
import {
  fetchDomainInfo,
  fetchDnsInfo,
  fetchSslInfo,
  runDomainAudit,
} from "@/lib/audit/domain-intel";
import { detectTechnologies, runTechnologyAudit } from "@/lib/audit/technology";
import {
  extractSocialProfiles,
  extractExternalLinks,
  countInternalLinks,
} from "@/lib/audit/social";
import { fetchBacklinkProfile, runBacklinkAudit } from "@/lib/audit/backlinks";
import { buildSiteChecklist } from "@/lib/audit/checklist";
import {
  AuditOptions,
  AuditReport,
  CrawlSummary,
  computeCategoryScore,
  computeSummary,
  resetIssueCounter,
} from "@/lib/types";

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };
const MAX_CRAWL_PAGES = 10;

export async function runFullAudit(
  url: string,
  options: AuditOptions = {}
): Promise<AuditReport> {
  resetIssueCounter();

  const siteCrawl = options.siteCrawl ?? false;
  const maxPages = Math.min(options.maxPages ?? MAX_CRAWL_PAGES, MAX_CRAWL_PAGES);

  const fetchResult = await safeFetch(url);

  if (!fetchResult.html && fetchResult.status < 400) {
    throw new Error("Could not retrieve HTML content from the URL");
  }

  const ctx = { url: fetchResult.finalUrl, fetchResult };
  const hostname = new URL(fetchResult.finalUrl).hostname;

  const [
    seoIssues,
    linkIssues,
    perfResult,
    modernWebIssues,
    wwwIssues,
    domainInfo,
    dnsInfo,
    sslInfo,
    backlinkProfile,
  ] = await Promise.all([
    runSeoAudit(ctx),
    runLinksAudit(ctx),
    runPerformanceAudit(ctx),
    runModernWebAudit(fetchResult.finalUrl),
    runWwwConsistencyAudit(fetchResult.finalUrl),
    fetchDomainInfo(hostname),
    fetchDnsInfo(hostname),
    fetchSslInfo(hostname),
    fetchBacklinkProfile(fetchResult.finalUrl),
  ]);

  const technologies = detectTechnologies(ctx);
  const socialProfiles = extractSocialProfiles(ctx);
  const externalLinks = extractExternalLinks(ctx);
  const internalLinks = countInternalLinks(ctx);

  const accessibilityIssues = runAccessibilityAudit(ctx);
  const securityIssues = runSecurityAudit(ctx);
  const contentIssues = runContentAudit(ctx);
  const imageIssues = runImageAudit(ctx);
  const mobileSocialIssues = runMobileSocialAudit(ctx);
  const trustIssues = runTrustAudit(ctx);
  const domainIssues = runDomainAudit(hostname, domainInfo, dnsInfo, sslInfo);
  const technologyIssues = runTechnologyAudit(ctx, technologies);
  const backlinkIssues = runBacklinkAudit(backlinkProfile);

  let crawlSummary: CrawlSummary | undefined;
  let siteWideIssues: ReturnType<typeof runDuplicateMetaAudit> = [];

  if (siteCrawl && fetchResult.html) {
    const { pages: crawledPages, discoveredUrls } = await crawlSitePages(
      fetchResult.finalUrl,
      fetchResult.html,
      maxPages
    );

    siteWideIssues = [
      ...runDuplicateMetaAudit(crawledPages),
      ...runInternalLinkAudit(
        fetchResult.html,
        fetchResult.finalUrl,
        crawledPages.map((p) => p.url)
      ),
    ];

    crawlSummary = {
      enabled: true,
      pagesScanned: crawledPages.length,
      pagesDiscovered: discoveredUrls.length,
      pages: crawledPages.map((p) => ({
        url: p.url,
        pathname: new URL(p.url).pathname,
        title: p.title,
        description: p.description,
        hasH1: !!p.h1,
        status: p.status,
      })),
    };
  }

  const pageMeta = extractPageMeta(ctx);

  const checklist = await buildSiteChecklist(
    ctx,
    technologies,
    socialProfiles,
    dnsInfo,
    sslInfo,
    domainInfo,
    backlinkProfile.available,
    backlinkProfile.totalBacklinks
  );

  const allIssues = [
    ...seoIssues,
    ...contentIssues,
    ...mobileSocialIssues,
    ...imageIssues,
    ...accessibilityIssues,
    ...securityIssues,
    ...linkIssues,
    ...trustIssues,
    ...modernWebIssues,
    ...wwwIssues,
    ...domainIssues,
    ...technologyIssues,
    ...backlinkIssues,
    ...siteWideIssues,
    ...perfResult.issues,
  ];

  allIssues.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  let performanceScore = computeCategoryScore(allIssues, "performance");
  if (perfResult.performanceScore !== undefined) {
    performanceScore = perfResult.performanceScore;
  }

  let accessibilityScore = computeCategoryScore(allIssues, "accessibility");
  if (perfResult.accessibilityScore !== undefined) {
    accessibilityScore = perfResult.accessibilityScore;
  }

  let displayUrl = fetchResult.finalUrl;
  try {
    const parsed = new URL(fetchResult.finalUrl);
    displayUrl = parsed.hostname + parsed.pathname;
  } catch {
    // keep full url
  }

  return {
    url: fetchResult.finalUrl,
    scannedAt: new Date().toISOString(),
    scores: {
      seo: computeCategoryScore(allIssues, "seo"),
      performance: performanceScore,
      accessibility: accessibilityScore,
      security: computeCategoryScore(allIssues, "security"),
    },
    issues: allIssues,
    summary: computeSummary(allIssues),
    performanceMetrics: perfResult.metrics,
    serpPreview: {
      title: pageMeta.title,
      description: pageMeta.description,
      url: displayUrl,
    },
    crawl: crawlSummary,
    checklist,
    siteOverview: {
      domain: {
        registrar: domainInfo.registrar,
        created: domainInfo.created,
        expires: domainInfo.expires,
        daysUntilExpiry: domainInfo.daysUntilExpiry,
        nameservers: domainInfo.nameservers,
      },
      dns: {
        mxRecords: dnsInfo.mxRecords,
        hasSpf: dnsInfo.hasSpf,
        hasDmarc: dnsInfo.hasDmarc,
        hasDkim: dnsInfo.hasDkim,
        ipv4: dnsInfo.ipv4,
        ipv6: dnsInfo.ipv6,
      },
      ssl: {
        issuer: sslInfo.issuer,
        validTo: sslInfo.validTo,
        daysUntilExpiry: sslInfo.daysUntilExpiry,
        protocol: sslInfo.protocol,
      },
      technologies,
      socialProfiles,
      externalLinks: {
        total: externalLinks.total,
        uniqueDomains: externalLinks.uniqueDomains,
        topDomains: externalLinks.topDomains,
      },
      internalLinks,
      backlinks: backlinkProfile.available
        ? {
            available: true,
            totalBacklinks: backlinkProfile.totalBacklinks,
            referringDomains: backlinkProfile.referringDomains,
            dofollowBacklinks: backlinkProfile.dofollowBacklinks,
            nofollowBacklinks: backlinkProfile.nofollowBacklinks,
            domainRank: backlinkProfile.domainRank,
            topBacklinks: backlinkProfile.topBacklinks,
          }
        : { available: false },
    },
  };
}

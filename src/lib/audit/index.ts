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
import { runDeepChecksAudit } from "@/lib/audit/deep-checks";
import { buildSiteChecklist } from "@/lib/audit/checklist";
import {
  AuditOptions,
  AuditReport,
  CrawlSummary,
  computeCategoryScore,
  computeSummary,
  createIssue,
  resetIssueCounter,
} from "@/lib/types";

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export async function runFullAudit(
  url: string,
  options: AuditOptions = {}
): Promise<AuditReport> {
  resetIssueCounter();

  const siteCrawl = options.siteCrawl ?? false;

  const fetchResult = await safeFetch(url);

  if (!fetchResult.html && fetchResult.status < 400) {
    throw new Error("Could not retrieve HTML content from the URL");
  }

  const ctx = { url: fetchResult.finalUrl, fetchResult };
  const hostname = new URL(fetchResult.finalUrl).hostname;

  const [
    seoResult,
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
    process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
      ? fetchBacklinkProfile(fetchResult.finalUrl)
      : Promise.resolve({ available: false as const }),
  ]);

  const seoIssues = seoResult.issues;

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
  const deepIssues = await runDeepChecksAudit(ctx);

  let crawlSummary: CrawlSummary | undefined;
  let siteWideIssues: ReturnType<typeof runDuplicateMetaAudit> = [];

  if (siteCrawl && fetchResult.html) {
    const { pages: crawledPages, totalFound, allDiscovered } = await crawlSitePages(
      fetchResult.finalUrl,
      fetchResult.html
    );

    const scannedUrls = new Set(crawledPages.map((p) => p.url));
    const notScannedPaths = allDiscovered
      .filter((u) => !scannedUrls.has(u))
      .map((u) => {
        try {
          return new URL(u).pathname || "/";
        } catch {
          return u;
        }
      });

    siteWideIssues = [
      ...runDuplicateMetaAudit(crawledPages),
      ...runInternalLinkAudit(
        fetchResult.html,
        fetchResult.finalUrl,
        crawledPages.map((p) => p.url)
      ),
    ];

    if (totalFound > crawledPages.length) {
      siteWideIssues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: `Large site — ${totalFound} pages found, ${crawledPages.length} scanned in detail`,
          description:
            "We discovered every page from your sitemap and internal links. Duplicate-title checks run on scanned pages; the full page list is shown in the report.",
          currentValue: `${totalFound} pages found`,
          recommendation:
            "Review unscanned pages in the site list below, or run separate scans on important URLs for a full per-page audit.",
        })
      );
    }

    const allPagePaths = allDiscovered.map((u) => {
      try {
        return new URL(u).pathname || "/";
      } catch {
        return u;
      }
    });

    crawlSummary = {
      enabled: true,
      pagesScanned: crawledPages.length,
      totalPagesFound: totalFound,
      pagesDiscovered: totalFound,
      allPagePaths,
      pagesNotScanned: notScannedPaths.length > 0 ? notScannedPaths : undefined,
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

  const checklist = buildSiteChecklist(
    ctx,
    technologies,
    socialProfiles,
    dnsInfo,
    sslInfo,
    domainInfo,
    seoResult.hasRobotsTxt,
    seoResult.hasSitemap,
    backlinkProfile.available,
    backlinkProfile.available ? backlinkProfile.totalBacklinks : undefined,
    {
      brokenLinkCount: linkIssues.filter((i) => i.title.startsWith("Broken link")).length,
      brokenImageCount: deepIssues.filter((i) => i.title === "Broken image").length,
      isIndexable: !deepIssues.some((i) => i.title.includes("noindex")),
      hasValidSchema: !deepIssues.some((i) => i.title.includes("Invalid structured data")),
      hasManifest: !modernWebIssues.some((i) => i.title.toLowerCase().includes("manifest")),
      hasLlmsTxt: !modernWebIssues.some((i) => i.title.toLowerCase().includes("llms.txt")),
      hasMixedContent: securityIssues.some((i) => i.title.includes("Mixed content")),
      wwwDuplicate: wwwIssues.length > 0,
      hasRedirectChain: deepIssues.some((i) => i.title.includes("Redirect chain")),
    }
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
    ...deepIssues,
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

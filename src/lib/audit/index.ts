import { safeFetch } from "@/lib/fetcher";
import { runSeoAudit } from "@/lib/audit/seo";
import { runAccessibilityAudit } from "@/lib/audit/accessibility";
import { runSecurityAudit } from "@/lib/audit/security";
import { runLinksAudit, runCrawlBrokenLinksAudit } from "@/lib/audit/links";
import { runPerformanceAudit } from "@/lib/audit/performance";
import { runContentAudit, extractPageMeta } from "@/lib/audit/content";
import { runImageAudit } from "@/lib/audit/images";
import { runMobileSocialAudit } from "@/lib/audit/mobile-social";
import { crawlSitePages } from "@/lib/audit/crawl";
import {
  buildCrawlCoverage,
  runCoverageAudit,
  runCrawlPageSignalAudit,
  runDuplicateMetaAudit,
  runInternalLinkAudit,
  runLinkDepthAudit,
} from "@/lib/audit/site-wide";
import { pathToTemplate } from "@/lib/issue-groups";
import { runAiVisibilityAudit } from "@/lib/audit/ai-visibility";
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
import { runLocalSeoAudit } from "@/lib/audit/local-seo";
import { runDeepChecksAudit } from "@/lib/audit/deep-checks";
import { runComprehensiveChecksAudit } from "@/lib/audit/comprehensive-checks";
import { buildSiteChecklist } from "@/lib/audit/checklist";
import * as cheerio from "cheerio";
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

  // Full site crawl is on by default. Competitors can pass siteCrawl: false for a faster homepage audit.
  const siteCrawl = options.siteCrawl !== false;
  const onProgress = options.onProgress;

  onProgress?.({ type: "stage", stage: "fetch", message: "Fetching starting page…" });

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
  const localSeoIssues = fetchResult.html
    ? runLocalSeoAudit(fetchResult.html, fetchResult.finalUrl)
    : [];
  const deepIssues = await runDeepChecksAudit(ctx);
  const comprehensiveIssues = await runComprehensiveChecksAudit(ctx);
  const aiVisibility = await runAiVisibilityAudit(ctx);

  let crawlSummary: CrawlSummary | undefined;
  let siteWideIssues: ReturnType<typeof runDuplicateMetaAudit> = [];

  if (siteCrawl && fetchResult.html) {
    onProgress?.({ type: "stage", stage: "sitemap", message: "Reading sitemap & discovering pages…" });
    const crawlControls = {
      maxPages: options.maxPages,
      includePaths: options.includePaths,
      excludePaths: options.excludePaths,
      startPath: options.startPath,
    };
    const {
      pages: crawledPages,
      totalFound,
      hitCap,
      controlsApplied,
    } = await crawlSitePages(
      fetchResult.finalUrl,
      fetchResult.html,
      (p) =>
        onProgress?.({
          type: "crawl",
          scanned: p.scanned,
          queued: p.queued,
          lastPath: p.lastPath,
        }),
      crawlControls
    );
    onProgress?.({
      type: "stage",
      stage: "checks",
      message: `Running checks across ${crawledPages.length} pages…`,
    });

    siteWideIssues = [
      ...runDuplicateMetaAudit(crawledPages),
      ...runInternalLinkAudit(
        fetchResult.html,
        fetchResult.finalUrl,
        crawledPages.map((p) => p.url)
      ),
      ...runLinkDepthAudit(crawledPages, fetchResult.finalUrl),
      ...runCoverageAudit(crawledPages),
      ...runCrawlPageSignalAudit(crawledPages),
    ];

    const crawlLinkIssues = await runCrawlBrokenLinksAudit(
      crawledPages,
      fetchResult.finalUrl
    );
    siteWideIssues.push(...crawlLinkIssues);

    if (hitCap) {
      siteWideIssues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: `Very large site — scanned ${crawledPages.length} pages (scan cap reached)`,
          description:
            "This site has more pages than a single scan can cover. Every page we discovered within the limit was scanned in detail.",
          currentValue: `${crawledPages.length} pages scanned`,
          recommendation:
            "Re-scan important sections by pasting a deeper starting URL, or review the page list below for gaps.",
        })
      );
    }

    const missingCanonical = crawledPages.filter((p) => !p.canonical).length;
    const thinPages = crawledPages.filter((p) => (p.wordCount ?? 0) > 0 && (p.wordCount ?? 0) < 100).length;
    const noindexPages = crawledPages.filter((p) => (p.robots || "").toLowerCase().includes("noindex")).length;
    const multiH1 = crawledPages.filter((p) => (p.h1Count ?? 0) > 1).length;
    const errorPages = crawledPages.filter((p) => p.status >= 400).length;

    if (missingCanonical > 0) {
      siteWideIssues.push(
        createIssue({
          category: "seo",
          severity: missingCanonical > 5 ? "warning" : "info",
          title: `${missingCanonical} page${missingCanonical === 1 ? "" : "s"} missing canonical`,
          description: "Canonical tags help Google pick the preferred URL for each page.",
          currentValue: `${missingCanonical} / ${crawledPages.length}`,
          recommendation: "Add a self-referencing canonical on every indexable page.",
        })
      );
    }
    if (thinPages > 0) {
      siteWideIssues.push(
        createIssue({
          category: "seo",
          severity: "warning",
          title: `${thinPages} thin content page${thinPages === 1 ? "" : "s"} (< 100 words)`,
          description: "Very short pages often rank poorly and can look low-quality.",
          currentValue: `${thinPages} pages`,
          recommendation: "Expand useful content or noindex true utility pages.",
        })
      );
    }
    if (noindexPages > 0) {
      siteWideIssues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: `${noindexPages} page${noindexPages === 1 ? "" : "s"} marked noindex`,
          description: "These pages ask search engines not to index them.",
          currentValue: `${noindexPages} pages`,
          recommendation: "Confirm noindex is intentional for each of these URLs.",
        })
      );
    }
    if (multiH1 > 0) {
      siteWideIssues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: `${multiH1} page${multiH1 === 1 ? "" : "s"} with multiple H1 tags`,
          description: "Best practice is a single H1 per page.",
          currentValue: `${multiH1} pages`,
          recommendation: "Keep one H1 and use H2/H3 for subsections.",
        })
      );
    }
    if (errorPages > 0) {
      siteWideIssues.push(
        createIssue({
          category: "links",
          severity: "critical",
          title: `${errorPages} crawled page${errorPages === 1 ? "" : "s"} return HTTP errors`,
          description: "Broken pages hurt crawl budget and user experience.",
          currentValue: `${errorPages} pages`,
          recommendation: "Fix or remove URLs that return 4xx/5xx responses.",
        })
      );
    }

    const allPagePaths = crawledPages.map((p) => {
      try {
        return new URL(p.url).pathname || "/";
      } catch {
        return p.url;
      }
    });

    crawlSummary = {
      enabled: true,
      pagesScanned: crawledPages.length,
      totalPagesFound: totalFound,
      pagesDiscovered: totalFound,
      hitCap,
      allPagePaths,
      controls: {
        maxPages: controlsApplied.maxPages,
        includePaths: controlsApplied.includePaths || [],
        excludePaths: controlsApplied.excludePaths || [],
        startPath: controlsApplied.startPath,
      },
      coverage: buildCrawlCoverage(crawledPages, fetchResult.finalUrl),
      pages: crawledPages.map((p) => ({
        url: p.url,
        pathname: (() => {
          try {
            return new URL(p.url).pathname;
          } catch {
            return p.url;
          }
        })(),
        title: p.title,
        description: p.description,
        hasH1: !!p.h1,
        status: p.status,
        canonical: p.canonical,
        robots: p.robots,
        hasOg: p.hasOg,
        wordCount: p.wordCount,
        h1Count: p.h1Count,
        depth: p.depth,
        inboundLinks: p.inboundLinks,
        redirected: p.redirected,
        finalUrl: p.finalUrl,
        hreflangCount: p.hreflang?.length ?? 0,
      })),
    };
  }

  onProgress?.({ type: "stage", stage: "score", message: "Scoring results…" });

  const pageMeta = extractPageMeta(ctx);
  const jsonLdText = cheerio.load(ctx.fetchResult.html)('script[type="application/ld+json"]').text();

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
      hasFaqSchema: jsonLdText.includes("FAQPage"),
      hasOrganizationSchema:
        jsonLdText.includes("Organization") || jsonLdText.includes("LocalBusiness"),
      hasSecurityTxt: !comprehensiveIssues.some((i) => i.title.includes("security.txt")),
      hasMainLandmark: !comprehensiveIssues.some((i) => i.title === "No main landmark"),
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
    ...localSeoIssues,
    ...deepIssues,
    ...comprehensiveIssues,
    ...aiVisibility.issues,
    ...siteWideIssues,
    ...perfResult.issues,
  ];

  // Enrich issues with path templates when a page path is present
  for (const issue of allIssues) {
    if (issue.pagePath && !issue.pathTemplate) {
      issue.pathTemplate = pathToTemplate(issue.pagePath);
    }
  }

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
      ai: aiVisibility.score,
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
    aiVisibility: {
      score: aiVisibility.score,
      signals: aiVisibility.signals,
      botsAllowed: aiVisibility.botsAllowed,
      botsBlocked: aiVisibility.botsBlocked,
    },
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

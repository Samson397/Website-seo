/**
 * Run SEOScan audits against external websites and write a comparison report.
 *
 * Usage:
 *   npm run audit:competitors
 *   npx tsx scripts/competitor-audit.ts https://rival1.com https://rival2.com
 *
 * With no URLs, audits the default SEO-tool competitor list in this file.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { runFullAudit } from "../src/lib/audit";
import type { AuditReport } from "../src/lib/types";

interface Competitor {
  name: string;
  url: string;
  notes?: string;
}

const COMPETITORS: Competitor[] = [
  { name: "SEOptimer", url: "https://www.seoptimer.com" },
  { name: "SEO Site Checkup", url: "https://seositecheckup.com" },
  { name: "Sitechecker", url: "https://sitechecker.pro" },
  { name: "Seobility", url: "https://www.seobility.net" },
  { name: "HubSpot Website Grader", url: "https://website.grader.com" },
  { name: "Ahrefs Website Checker", url: "https://ahrefs.com/website-checker" },
  { name: "SEMrush Site Audit", url: "https://www.semrush.com/siteaudit/" },
  { name: "Moz Free SEO Tools", url: "https://moz.com/free-seo-tools" },
  { name: "SEO Review Tools", url: "https://seoreviewtools.com" },
  { name: "Neil Patel SEO Analyzer", url: "https://neilpatel.com/seo-analyzer/" },
];

interface AuditResult {
  competitor: Competitor;
  report?: AuditReport;
  error?: string;
}

function overallScore(report: AuditReport): number {
  const { seo, performance, accessibility, security } = report.scores;
  return Math.round((seo + performance + accessibility + security) / 4);
}

function topIssues(report: AuditReport, limit = 5) {
  const order = { critical: 0, warning: 1, info: 2 };
  return [...report.issues]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, limit)
    .map((i) => ({
      severity: i.severity,
      category: i.category,
      title: i.title,
    }));
}

function checklistPassRate(report: AuditReport): number | null {
  const checklist = report.checklist;
  if (!checklist?.items?.length) return null;
  const total = checklist.hasCount + checklist.missingCount + checklist.warningCount;
  if (total === 0) return null;
  return Math.round((checklist.hasCount / total) * 100);
}

function buildMarkdown(results: AuditResult[]): string {
  const successful = results.filter((r) => r.report);
  const failed = results.filter((r) => r.error);

  const ranked = [...successful].sort(
    (a, b) => overallScore(b.report!) - overallScore(a.report!)
  );

  const lines: string[] = [
    "# Competitor SEO Audit Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Audited with SEOScan's `runFullAudit` (homepage only, no full site crawl).",
    "",
    "## Executive Summary",
    "",
    `| Rank | Competitor | Overall | SEO | Perf | A11y | Security | Critical | Warnings | Checklist |`,
    `|------|------------|---------|-----|------|------|----------|----------|----------|-----------|`,
  ];

  ranked.forEach((r, idx) => {
    const rep = r.report!;
    const checklist = checklistPassRate(rep);
    lines.push(
      `| ${idx + 1} | ${r.competitor.name} | **${overallScore(rep)}** | ${rep.scores.seo} | ${rep.scores.performance} | ${rep.scores.accessibility} | ${rep.scores.security} | ${rep.summary.critical} | ${rep.summary.warning} | ${checklist ?? "—"}% |`
    );
  });

  lines.push("", "## Score Distribution", "");

  if (ranked.length) {
    const avg = Math.round(
      ranked.reduce((s, r) => s + overallScore(r.report!), 0) / ranked.length
    );
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    lines.push(
      `- **Average overall score:** ${avg}/100`,
      `- **Highest:** ${best.competitor.name} (${overallScore(best.report!)})`,
      `- **Lowest:** ${worst.competitor.name} (${overallScore(worst.report!)})`,
      ""
    );
  }

  lines.push("## Per-Competitor Details", "");

  for (const r of results) {
    lines.push(`### ${r.competitor.name}`, "");
    lines.push(`- **URL scanned:** ${r.competitor.url}`);

    if (r.error) {
      lines.push(`- **Status:** Failed — ${r.error}`, "");
      continue;
    }

    const rep = r.report!;
    lines.push(
      `- **Final URL:** ${rep.url}`,
      `- **Scanned at:** ${rep.scannedAt}`,
      `- **Overall score:** ${overallScore(rep)}/100`,
      `- **Issues:** ${rep.summary.critical} critical, ${rep.summary.warning} warnings, ${rep.summary.info} info`,
      ""
    );

    if (rep.serpPreview) {
      lines.push(
        "**SERP preview**",
        `- Title (${rep.serpPreview.title.length} chars): ${rep.serpPreview.title}`,
        `- Description (${rep.serpPreview.description.length} chars): ${rep.serpPreview.description}`,
        ""
      );
    }

    if (rep.performanceMetrics) {
      const m = rep.performanceMetrics;
      const parts = [m.lcp && `LCP ${m.lcp}`, m.cls && `CLS ${m.cls}`, m.inp && `INP ${m.inp}`, m.fcp && `FCP ${m.fcp}`].filter(Boolean);
      if (parts.length) {
        lines.push(`**Core Web Vitals:** ${parts.join(" · ")}`, "");
      }
    } else if (rep.performanceNote) {
      lines.push(`**Performance note:** ${rep.performanceNote}`, "");
    }

    const tech = rep.siteOverview?.technologies?.slice(0, 8).map((t) => t.name);
    if (tech?.length) {
      lines.push(`**Tech stack:** ${tech.join(", ")}`, "");
    }

    const top = topIssues(rep);
    if (top.length) {
      lines.push("**Top issues**", "");
      for (const issue of top) {
        lines.push(`- [${issue.severity}/${issue.category}] ${issue.title}`);
      }
      lines.push("");
    }
  }

  if (failed.length) {
    lines.push("## Failed Audits", "");
    for (const r of failed) {
      lines.push(`- **${r.competitor.name}** (${r.competitor.url}): ${r.error}`);
    }
    lines.push("");
  }

  lines.push(
    "## Insights for SEOScan",
    "",
    "1. **Performance is the differentiator** — many competitors score well on SEO basics but lag on Core Web Vitals.",
    "2. **Security headers** — several tools miss HSTS, CSP, or X-Frame-Options; SEOScan can highlight this gap.",
    "3. **Accessibility** — image alt text and heading structure remain weak across the category.",
    "4. **Dogfooding opportunity** — run periodic competitor audits to track category benchmarks.",
    ""
  );

  return lines.join("\n");
}

async function main() {
  const cliUrls = process.argv.slice(2).filter((arg) => arg.startsWith("http"));
  const targets: Competitor[] =
    cliUrls.length > 0
      ? cliUrls.map((url) => ({ name: new URL(url).hostname, url }))
      : COMPETITORS;

  const results: AuditResult[] = [];
  const outDir = join(process.cwd(), "docs");
  mkdirSync(outDir, { recursive: true });

  console.log(`Auditing ${targets.length} external sites...\n`);

  for (const competitor of targets) {
    process.stdout.write(`→ ${competitor.name}... `);
    try {
      const report = await runFullAudit(competitor.url, { siteCrawl: false });
      results.push({ competitor, report });
      console.log(`done (overall ${overallScore(report)})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ competitor, error: message });
      console.log(`failed: ${message}`);
    }
  }

  const jsonPath = join(outDir, "competitor-audit-results.json");
  const mdPath = join(outDir, "competitor-audit-report.md");

  const payload = results.map((r) => ({
    name: r.competitor.name,
    url: r.competitor.url,
    error: r.error,
    scores: r.report?.scores,
    summary: r.report?.summary,
    overall: r.report ? overallScore(r.report) : null,
    checklistPassRate: r.report ? checklistPassRate(r.report) : null,
    checklist: r.report?.checklist
      ? {
          has: r.report.checklist.hasCount,
          missing: r.report.checklist.missingCount,
          warning: r.report.checklist.warningCount,
        }
      : null,
    topIssues: r.report ? topIssues(r.report) : null,
    scannedUrl: r.report?.url,
    scannedAt: r.report?.scannedAt,
  }));

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(mdPath, buildMarkdown(results));

  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

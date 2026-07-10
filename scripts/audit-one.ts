import { runFullAudit } from "../src/lib/audit";

async function main() {
  const url = process.argv[2] ?? "https://seoscan-five.vercel.app";
  const report = await runFullAudit(url, { siteCrawl: false });
  const overall = Math.round(
    (report.scores.seo + report.scores.performance + report.scores.accessibility + report.scores.security) / 4
  );
  const checklist = report.checklist;
  const checklistPct = checklist
    ? Math.round((checklist.hasCount / (checklist.hasCount + checklist.missingCount + checklist.warningCount)) * 100)
    : null;

  console.log(
    JSON.stringify(
      {
        url: report.url,
        overall,
        scores: report.scores,
        summary: report.summary,
        checklistPct,
        checklist: checklist
          ? { has: checklist.hasCount, missing: checklist.missingCount, warning: checklist.warningCount }
          : null,
        serp: report.serpPreview,
        performanceMetrics: report.performanceMetrics,
        performanceNote: report.performanceNote,
        technologies: report.siteOverview?.technologies?.slice(0, 8).map((t) => t.name),
        topIssues: [...report.issues]
          .sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]))
          .slice(0, 12)
          .map((i) => ({ severity: i.severity, category: i.category, title: i.title })),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

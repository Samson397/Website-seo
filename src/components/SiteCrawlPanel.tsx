"use client";

import type { CrawlSummary } from "@/lib/types";

interface SiteCrawlPanelProps {
  crawl: CrawlSummary;
}

function pageFlags(page: CrawlSummary["pages"][number]): string[] {
  const flags: string[] = [];
  if (page.status >= 400) flags.push(`HTTP ${page.status}`);
  if (!page.hasH1) flags.push("No H1");
  if ((page.h1Count ?? 0) > 1) flags.push("Multi H1");
  if (!page.canonical) flags.push("No canonical");
  if ((page.robots || "").toLowerCase().includes("noindex")) flags.push("noindex");
  if ((page.wordCount ?? 0) > 0 && (page.wordCount ?? 0) < 100) flags.push("Thin");
  if (page.hasOg === false) flags.push("No OG");
  if (page.redirected) flags.push("Redirect");
  if ((page.inboundLinks ?? 0) === 0 && page.pathname !== "/") flags.push("Orphan?");
  if ((page.depth ?? 0) >= 4) flags.push(`Depth ${page.depth}`);
  return flags;
}

export function SiteCrawlPanel({ crawl }: SiteCrawlPanelProps) {
  const total = crawl.totalPagesFound ?? crawl.pagesDiscovered;
  const coverage = crawl.coverage;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/5 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Site map</p>
        <h3 className="font-display mt-1 text-xl font-semibold text-ink sm:text-2xl">
          {total} page{total === 1 ? "" : "s"} scanned
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Every page discovered from your sitemap and internal links was checked for title,
          description, H1, canonical, robots, depth, and word count
          {crawl.hitCap ? " (scan reached the size limit for very large sites)." : "."}
        </p>
        {crawl.controls ? (
          <p className="mt-2 text-xs text-ink-muted">
            Cap {crawl.controls.maxPages}
            {crawl.controls.startPath ? ` · start ${crawl.controls.startPath}` : ""}
            {crawl.controls.includePaths.length
              ? ` · include ${crawl.controls.includePaths.join(", ")}`
              : ""}
            {crawl.controls.excludePaths.length
              ? ` · exclude ${crawl.controls.excludePaths.join(", ")}`
              : ""}
          </p>
        ) : null}
      </div>

      {coverage ? (
        <div className="grid grid-cols-2 gap-3 border-b border-ink/5 px-5 py-4 sm:grid-cols-4 sm:px-6">
          <CoverageStat
            label="Canonicals"
            value={`${coverage.withCanonical}/${total}`}
          />
          <CoverageStat label="Redirects" value={String(coverage.redirected)} />
          <CoverageStat label="Hreflang" value={String(coverage.withHreflang)} />
          <CoverageStat label="Orphans" value={String(coverage.orphans)} />
        </div>
      ) : null}

      <div className="overflow-x-auto px-2 sm:px-4">
        <p className="px-3 pb-2 text-xs text-ink-muted md:hidden">Swipe sideways to see all columns</p>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-3 font-medium">Page</th>
              <th className="px-3 py-3 font-medium">Depth</th>
              <th className="px-3 py-3 font-medium">In</th>
              <th className="px-3 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Words</th>
              <th className="px-3 py-3 font-medium">Signals</th>
            </tr>
          </thead>
          <tbody>
            {crawl.pages.map((page) => {
              const pathname = page.pathname || "/";
              const flags = pageFlags(page);
              const bad = page.status >= 400 || flags.some((f) => f.startsWith("HTTP") || f === "Thin");
              return (
                <tr key={page.url} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">{pathname}</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-muted">{page.depth ?? "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-muted">
                    {page.inboundLinks ?? "—"}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-ink" title={page.title}>
                    {page.title || "—"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-muted">
                    {page.wordCount != null ? page.wordCount : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {flags.length === 0 ? (
                      <span className="inline-flex rounded-md bg-teal-soft px-2 py-0.5 text-xs font-semibold text-teal">
                        OK
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {flags.map((f) => (
                          <span
                            key={f}
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                              bad && (f.startsWith("HTTP") || f === "Thin")
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-soft text-amber-900"
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoverageStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="font-display text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

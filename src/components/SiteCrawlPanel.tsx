"use client";

import type { CrawlSummary } from "@/lib/types";

interface SiteCrawlPanelProps {
  crawl: CrawlSummary;
}

export function SiteCrawlPanel({ crawl }: SiteCrawlPanelProps) {
  const total = crawl.totalPagesFound ?? crawl.pagesDiscovered;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/5 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Site map</p>
        <h3 className="font-display mt-1 text-xl font-semibold text-ink sm:text-2xl">
          {total} page{total === 1 ? "" : "s"} scanned
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Every page discovered from your sitemap and internal links was checked for title,
          description, H1, and HTTP status
          {crawl.hitCap
            ? " (scan reached the size limit for very large sites)."
            : "."}
        </p>
      </div>

      <div className="overflow-x-auto px-2 sm:px-4">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-3 font-medium">Page</th>
              <th className="px-3 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Description</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {crawl.pages.map((page) => {
              const pathname = page.pathname || "/";
              return (
                <tr key={page.url} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">{pathname}</td>
                  <td
                    className="max-w-[180px] truncate px-3 py-2.5 text-ink"
                    title={page.title}
                  >
                    {page.title}
                  </td>
                  <td
                    className="max-w-[200px] truncate px-3 py-2.5 text-ink-muted"
                    title={page.description}
                  >
                    {page.description || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                        page.status >= 400
                          ? "bg-rose-100 text-rose-700"
                          : page.hasH1
                            ? "bg-teal-soft text-teal-800"
                            : "bg-amber-soft text-amber-900"
                      }`}
                    >
                      {page.status >= 400
                        ? `HTTP ${page.status}`
                        : page.hasH1
                          ? "OK"
                          : "No H1"}
                    </span>
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

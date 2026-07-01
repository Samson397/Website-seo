"use client";

import type { CrawlSummary } from "@/lib/types";

interface SiteCrawlPanelProps {
  crawl: CrawlSummary;
}

export function SiteCrawlPanel({ crawl }: SiteCrawlPanelProps) {
  const total = crawl.totalPagesFound ?? crawl.pagesDiscovered;
  const notScanned = Math.max(0, total - crawl.pagesScanned);
  const hasMore = notScanned > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Site Scan — {crawl.pagesScanned} of {total} pages scanned
      </h3>

      {hasMore ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            Found <strong>{total}</strong> pages on your site — scanned{" "}
            <strong>{crawl.pagesScanned}</strong> (limit: {crawl.scanLimit ?? crawl.pagesScanned}).
          </p>
          <p className="mt-1 text-amber-800">
            <strong>{notScanned}</strong> page{notScanned === 1 ? "" : "s"} not scanned. Missing
            issues or duplicate titles on those pages won&apos;t show here. Scan them separately or
            raise the page limit.
          </p>
          {crawl.pagesNotScanned && crawl.pagesNotScanned.length > 0 && (
            <p className="mt-2 font-mono text-xs text-amber-700">
              Not scanned: {crawl.pagesNotScanned.join(", ")}
              {notScanned > crawl.pagesNotScanned.length ? ", …" : ""}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-600">
          Found {total} page{total === 1 ? "" : "s"} — all were scanned.
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="pb-2 pr-4 font-medium">Page</th>
              <th className="pb-2 pr-4 font-medium">Title</th>
              <th className="pb-2 pr-4 font-medium">Description</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {crawl.pages.map((page) => (
              <tr key={page.url} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-mono text-xs text-slate-600">
                  {page.pathname || "/"}
                </td>
                <td className="max-w-[180px] truncate py-2 pr-4 text-slate-800" title={page.title}>
                  {page.title}
                </td>
                <td
                  className="max-w-[200px] truncate py-2 pr-4 text-slate-500"
                  title={page.description}
                >
                  {page.description || "—"}
                </td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      page.status >= 400
                        ? "bg-red-100 text-red-700"
                        : page.hasH1
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {page.status >= 400 ? `HTTP ${page.status}` : page.hasH1 ? "OK" : "No H1"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

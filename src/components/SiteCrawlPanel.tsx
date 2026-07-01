"use client";

import type { CrawlSummary } from "@/lib/types";

interface SiteCrawlPanelProps {
  crawl: CrawlSummary;
}

export function SiteCrawlPanel({ crawl }: SiteCrawlPanelProps) {
  const total = crawl.totalPagesFound ?? crawl.pagesDiscovered;
  const notScanned = Math.max(0, total - crawl.pagesScanned);
  const scannedByPath = new Map(
    crawl.pages.map((p) => [p.pathname || "/", p])
  );

  const allPaths =
    crawl.allPagePaths && crawl.allPagePaths.length > 0
      ? crawl.allPagePaths
      : crawl.pages.map((p) => p.pathname || "/");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        {total} page{total === 1 ? "" : "s"} found on your site
      </h3>

      {notScanned > 0 ? (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p>
            We discovered <strong>{total}</strong> pages from your sitemap and internal links.
            Detailed SEO checks (title, description, H1) ran on{" "}
            <strong>{crawl.pagesScanned}</strong> page{crawl.pagesScanned === 1 ? "" : "s"}.
          </p>
          <p className="mt-1 text-blue-800">
            Every page is listed below. Pages without a title are listed but not fully scanned
            yet — common on very large sites.
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          All {total} page{total === 1 ? "" : "s"} were found and scanned in detail.
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
            {allPaths.map((pathname) => {
              const page = scannedByPath.get(pathname);
              if (page) {
                return (
                  <tr key={pathname} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono text-xs text-slate-600">{pathname}</td>
                    <td
                      className="max-w-[180px] truncate py-2 pr-4 text-slate-800"
                      title={page.title}
                    >
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
                );
              }

              return (
                <tr key={pathname} className="border-b border-slate-100 bg-slate-50/50">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-600">{pathname}</td>
                  <td className="py-2 pr-4 text-slate-400">—</td>
                  <td className="py-2 pr-4 text-slate-400">—</td>
                  <td className="py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Listed
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

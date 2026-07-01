"use client";

import { useState } from "react";

export const PAGE_LIMIT_OPTIONS = [10, 20, 30] as const;
export type PageLimit = (typeof PAGE_LIMIT_OPTIONS)[number];

interface UrlInputProps {
  onSubmit: (url: string, siteCrawl: boolean, maxPages: PageLimit) => void;
  loading: boolean;
}

export function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [siteCrawl, setSiteCrawl] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("url") as HTMLInputElement;
    const maxPagesInput = form.elements.namedItem("maxPages") as HTMLSelectElement;
    const url = input.value.trim();
    const maxPages = Number(maxPagesInput.value) as PageLimit;
    if (url) onSubmit(url, siteCrawl, maxPages);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="audit-url" className="sr-only">
          Website URL
        </label>
        <input
          id="audit-url"
          type="text"
          name="url"
          placeholder="https://yourwebsite.com"
          required
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-700/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Analyzing…" : "Analyze site"}
        </button>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
        <label
          htmlFor="siteCrawl"
          className="flex cursor-pointer items-start gap-3 text-sm text-slate-600"
        >
          <input
            id="siteCrawl"
            type="checkbox"
            name="siteCrawl"
            checked={siteCrawl}
            onChange={(e) => setSiteCrawl(e.target.checked)}
            disabled={loading}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <span className="font-medium text-slate-800">Full site scan</span>
            <span className="block text-xs text-slate-500">
              Find duplicate titles &amp; descriptions across multiple pages
            </span>
          </span>
        </label>

        {siteCrawl && (
          <div className="flex flex-col gap-1.5 border-t border-slate-200/80 pt-3 sm:flex-row sm:items-center sm:gap-3">
            <label htmlFor="maxPages" className="text-sm font-medium text-slate-700">
              Pages to scan
            </label>
            <select
              id="maxPages"
              name="maxPages"
              defaultValue={10}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PAGE_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} pages{n === 30 ? " (slower)" : ""}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              We find all pages from your sitemap + links, then scan up to this limit
            </span>
          </div>
        )}
      </div>
    </form>
  );
}

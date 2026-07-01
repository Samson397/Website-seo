"use client";

import { useState } from "react";

interface UrlInputProps {
  onSubmit: (url: string, siteCrawl: boolean) => void;
  loading: boolean;
}

export function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [siteCrawl, setSiteCrawl] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("url") as HTMLInputElement;
    const url = input.value.trim();
    if (url) onSubmit(url, siteCrawl);
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
          placeholder="yourwebsite.com"
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

      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
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
              Find every page from your sitemap and links — we report how many pages you have
              and check titles, descriptions, and duplicates across the site
            </span>
          </span>
        </label>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import type { CrawlControls } from "@/lib/crawl-options";
import { HARD_MAX_PAGES } from "@/lib/crawl-options";

export type ScanSubmitPayload = {
  url: string;
  crawl?: CrawlControls;
};

interface UrlInputProps {
  onSubmit: (payload: ScanSubmitPayload) => void;
  loading: boolean;
  /** Show advanced crawl controls (full unlock / payments off). */
  showCrawlControls?: boolean;
}

export function UrlInput({ onSubmit, loading, showCrawlControls = false }: UrlInputProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [maxPages, setMaxPages] = useState(String(HARD_MAX_PAGES));
  const [startPath, setStartPath] = useState("");
  const [includePaths, setIncludePaths] = useState("");
  const [excludePaths, setExcludePaths] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("url") as HTMLInputElement;
    const url = input.value.trim();
    if (!url) return;

    const crawl: CrawlControls | undefined = showCrawlControls
      ? {
          maxPages: Math.max(1, Math.min(HARD_MAX_PAGES, Number(maxPages) || HARD_MAX_PAGES)),
          startPath: startPath.trim() || undefined,
          includePaths: includePaths
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
          excludePaths: excludePaths
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        }
      : undefined;

    onSubmit({ url, crawl });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
          autoComplete="url"
          inputMode="url"
          className="flex-1 rounded-md border border-ink/15 bg-paper px-4 py-3.5 text-ink placeholder:text-ink-muted/55 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ink px-8 py-3.5 font-semibold text-white transition hover:bg-ink-soft focus:outline-none focus:ring-2 focus:ring-teal/35 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Scanning site…" : "Scan site"}
        </button>
      </div>

      <p className="text-center text-xs text-ink-muted">
        Free preview scores the homepage. Unlock for a full-site crawl and detailed fixes.
      </p>

      {showCrawlControls ? (
        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="text-xs font-semibold text-ink/80 hover:text-ink"
          >
            {advancedOpen ? "Hide" : "Show"} crawl controls
          </button>
          {advancedOpen ? (
            <div className="mt-3 grid gap-3 rounded-md border border-ink/10 bg-paper/80 p-3 sm:grid-cols-2">
              <label className="block text-xs text-ink-muted">
                Max pages (1–{HARD_MAX_PAGES})
                <input
                  type="number"
                  min={1}
                  max={HARD_MAX_PAGES}
                  value={maxPages}
                  onChange={(e) => setMaxPages(e.target.value)}
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-ink/12 bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Start path
                <input
                  type="text"
                  value={startPath}
                  onChange={(e) => setStartPath(e.target.value)}
                  placeholder="/blog"
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-ink/12 bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-xs text-ink-muted sm:col-span-1">
                Include paths (comma or newline)
                <textarea
                  value={includePaths}
                  onChange={(e) => setIncludePaths(e.target.value)}
                  placeholder="/blog, /products/*"
                  rows={2}
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-ink/12 bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-xs text-ink-muted sm:col-span-1">
                Exclude paths
                <textarea
                  value={excludePaths}
                  onChange={(e) => setExcludePaths(e.target.value)}
                  placeholder="/cart, /account/*"
                  rows={2}
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-ink/12 bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

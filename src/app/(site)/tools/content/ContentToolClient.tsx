"use client";

import { FormEvent, useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
type ContentResult = {
  score: number;
  keyword: string;
  wordCount: number;
  keywordDensity: number;
  keywordCount: number;
  recommendations: string[];
  inTitle: boolean;
  inMeta: boolean;
  inH1: boolean;
  inUrl: boolean;
};

export default function ContentOptimizerPage() {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ContentResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/tools/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, keyword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json as ContentResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Content SEO"
        title="Content optimizer"
        description="Score a page against a target keyword — placement, density, and readability tips."
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <form
          onSubmit={onSubmit}
          className="glass-panel space-y-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
        >
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/blog/post"
            className="w-full rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm"
          />
          <input
            type="text"
            required
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Target keyword"
            className="w-full rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Analyzing…" : "Analyze content"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">Content score</p>
              <p className="font-display mt-1 text-4xl font-semibold text-ink">{data.score}/100</p>
              <p className="mt-2 text-sm text-ink-muted">
                {data.wordCount} words · {data.keywordCount} keyword mentions ·{" "}
                {data.keywordDensity}% density
              </p>
            </div>
            <ul className="space-y-2">
              {data.recommendations.map((r) => (
                <li
                  key={r}
                  className="rounded-xl border border-amber-200 bg-amber-soft/40 px-4 py-3 text-sm text-amber-950"
                >
                  {r}
                </li>
              ))}
              {data.recommendations.length === 0 ? (
                <li className="rounded-xl border border-teal/20 bg-teal-soft/40 px-4 py-3 text-sm text-teal">
                  Strong on-page signals for this keyword.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

      </div>
    </main>
  );
}

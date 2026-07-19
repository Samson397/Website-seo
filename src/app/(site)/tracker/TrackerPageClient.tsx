"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHero, PrimaryCta } from "@/components/ui/PageHero";
import {
  addTrackedKeyword,
  clearTrackedKeywords,
  getTrackedKeywords,
  removeTrackedKeyword,
  updateTrackedKeyword,
  type KeywordTrackItem,
} from "@/lib/local-keywords";
import { RankHistoryChart } from "@/components/RankHistoryChart";
import { routes } from "@/lib/routes";

export default function TrackerPage() {
  const [items, setItems] = useState<KeywordTrackItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    setItems(getTrackedKeywords());
  }, []);

  async function checkRank(item: KeywordTrackItem) {
    const key = `${item.keyword}:${item.hostname}`;
    setChecking(key);
    setCheckError(null);
    try {
      const res = await fetch("/api/tools/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url, keyword: item.keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rank check failed");
      const serpPos =
        data.serp?.available && typeof data.serp.position === "number"
          ? data.serp.position
          : null;
      setItems(
        updateTrackedKeyword(item.keyword, item.url, {
          lastCheckedAt: new Date().toISOString(),
          lastScore: data.onPage.score,
          lastSerpPosition: serpPos,
          inTitle: data.onPage.inTitle,
          inH1: data.onPage.inH1,
          inMeta: data.onPage.inMeta,
          inUrl: data.onPage.inUrl,
          bodyCount: data.onPage.bodyCount,
        })
      );
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : "Rank check failed");
    } finally {
      setChecking(null);
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || !url.trim()) return;
    setItems(addTrackedKeyword(keyword, url));
    setKeyword("");
  }

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="On this device"
        title="Keyword tracker"
        description="Save target keywords per URL and re-check on-page rank signals anytime — no account."
        actions={<PrimaryCta href={routes.keywords}>Keyword research</PrimaryCta>}
      />

      <div className="mx-auto mt-10 max-w-3xl space-y-8 px-4 sm:px-6">
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Target keyword"
            className="flex-1 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yoursite.com/page"
            className="flex-[2] rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm"
          />
          <button type="submit" className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">
            Track
          </button>
        </form>

        {checkError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {checkError}
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="text-center text-sm text-ink-muted">
            No keywords tracked yet. Add one above or use{" "}
            <Link href={routes.keywords} className="text-teal hover:underline">
              keyword research
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  clearTrackedKeywords();
                  setItems([]);
                }}
                className="text-xs text-ink-muted hover:text-rose-600"
              >
                Clear all
              </button>
            </div>
            <ul className="divide-y divide-ink/5 border-t border-ink/10">
              {items.map((item) => (
                <li key={`${item.keyword}-${item.hostname}`} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{item.keyword}</p>
                      <p className="text-xs text-ink-muted">{item.hostname}</p>
                      {item.lastScore != null ? (
                        <p className="mt-1 text-sm text-teal">
                          On-page score {item.lastScore}/100
                          {item.lastCheckedAt
                            ? ` · ${new Date(item.lastCheckedAt).toLocaleDateString()}`
                            : ""}
                          {item.lastSerpPosition != null
                            ? ` · SERP #${item.lastSerpPosition}`
                            : ""}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-ink-muted">Not checked yet</p>
                      )}
                      <RankHistoryChart history={item.history} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={checking === `${item.keyword}:${item.hostname}`}
                        onClick={() => void checkRank(item)}
                        className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {checking === `${item.keyword}:${item.hostname}` ? "Checking…" : "Check rank"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setItems(removeTrackedKeyword(item.keyword, item.url))}
                        className="rounded-lg bg-mist px-3 py-1.5 text-xs text-ink-muted"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-ink/10 bg-white px-5 py-5 text-center">
              <p className="text-sm text-ink-muted">Next steps</p>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                <Link
                  href={routes.contentOptimizer}
                  className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink hover:border-brand/40"
                >
                  Optimize content
                </Link>
                <Link
                  href={routes.home}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
                >
                  Full site scan
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

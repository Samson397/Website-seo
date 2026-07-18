"use client";

import { FormEvent, useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { AdSlot } from "@/components/AdSlot";

type RankResult = {
  url: string;
  keyword: string;
  onPage: {
    inTitle: boolean;
    inMeta: boolean;
    inH1: boolean;
    inUrl: boolean;
    bodyCount: number;
    score: number;
  };
  serp: {
    position: number | null;
    url: string | null;
    source: string | null;
    available: boolean;
  };
};

export default function RankCheckerPage() {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RankResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/tools/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, keyword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json as RankResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Rank tracking"
        title="Keyword rank checker"
        description="On-page optimization score plus Google organic position when DataForSEO is configured."
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
        >
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yoursite.com/page"
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
            {loading ? "Checking…" : "Check rank"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="mt-8 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="On-page score" value={`${data.onPage.score}/100`} />
              <Stat
                label="Google position"
                value={
                  data.serp.position
                    ? `#${data.serp.position}`
                    : data.serp.available
                      ? "Not in top 100"
                      : "Add DataForSEO"
                }
              />
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              <Flag ok={data.onPage.inTitle} label="In title" />
              <Flag ok={data.onPage.inMeta} label="In meta description" />
              <Flag ok={data.onPage.inH1} label="In H1" />
              <Flag ok={data.onPage.inUrl} label="In URL slug" />
            </ul>
            <p className="text-sm text-ink-muted">
              Body mentions: <strong className="text-ink">{data.onPage.bodyCount}</strong>
            </p>
          </div>
        ) : null}

        <div className="mt-10">
          <AdSlot />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={`rounded-xl px-3 py-2 text-sm font-medium ${
        ok ? "bg-teal-soft text-teal" : "bg-mist text-ink-muted"
      }`}
    >
      {ok ? "✓" : "–"} {label}
    </li>
  );
}

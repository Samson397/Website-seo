"use client";

import { useState, type FormEvent } from "react";

type CompareResult = {
  url: string;
  static: {
    status: number;
    finalUrl: string;
    title: string;
    metaDescription: string;
    h1: string;
    wordCount: number;
  };
  rendered: {
    ok: boolean;
    status: number;
    finalUrl: string;
    source: string;
    error?: string;
    title: string;
    metaDescription: string;
    h1: string;
    wordCount: number;
  };
  delta: { titleChanged: boolean; wordCountDelta: number };
};

export default function JsRenderToolClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompareResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/tools/js-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json as CompareResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
          JavaScript rendering
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink">
          Static HTML vs JS-rendered
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Compare the public HTML fetch (what SEOHub audits by default) with a browser-rendered
          snapshot via DataForSEO Instant Pages when configured.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:flex-row"
        >
          <input
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Rendering…" : "Compare"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        {data ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="font-display text-lg font-semibold">Static HTML</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-ink-muted">Title</dt>
                  <dd className="text-ink">{data.static.title || "—"}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">H1</dt>
                  <dd className="text-ink">{data.static.h1 || "—"}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Words</dt>
                  <dd className="text-ink">{data.static.wordCount}</dd>
                </div>
              </dl>
            </section>
            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="font-display text-lg font-semibold">JS-rendered</h2>
              {!data.rendered.ok ? (
                <p className="mt-3 text-sm text-rose-600">
                  {data.rendered.error || "Render unavailable"}
                </p>
              ) : (
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-ink-muted">Title</dt>
                    <dd className="text-ink">{data.rendered.title || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">H1</dt>
                    <dd className="text-ink">{data.rendered.h1 || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Words</dt>
                    <dd className="text-ink">{data.rendered.wordCount}</dd>
                  </div>
                </dl>
              )}
              <p className="mt-4 text-xs text-ink-muted">
                Word delta: {data.delta.wordCountDelta >= 0 ? "+" : ""}
                {data.delta.wordCountDelta}
                {data.delta.titleChanged ? " · title differs" : ""}
              </p>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

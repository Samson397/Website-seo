"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";

type Result = {
  available: boolean;
  yours?: {
    hostname: string;
    referringDomains: number;
    totalBacklinks: number;
    domainRank?: number;
  };
  toxic?: Array<{ sourceUrl: string; sourceDomain: string; anchor?: string; reasons: string[] }>;
  opportunities?: Array<{ domain: string; sampleUrl?: string; competitor: string; reason: string }>;
  summary?: string;
  error?: string;
};

export default function BacklinksToolClient() {
  const [yours, setYours] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const comps = competitors
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      const res = await fetch("/api/tools/backlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yours, competitors: comps }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json as Result);
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
          Backlink intelligence
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink">
          Competitor links & toxic review
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Find sites that link to competitors (but not you), plus low-quality / toxic link signals.
          Uses DataForSEO when configured.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
        >
          <label className="block text-sm">
            <span className="font-medium text-ink">Your site</span>
            <input
              required
              value={yours}
              onChange={(e) => setYours(e.target.value)}
              placeholder="https://yoursite.com"
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Competitors (up to 3)</span>
            <textarea
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              rows={3}
              placeholder={"competitor1.com\ncompetitor2.com"}
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
          >
            {loading ? "Analyzing…" : "Find opportunities"}
          </button>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </form>

        {data ? (
          <div className="mt-10 space-y-8">
            {data.error ? <p className="text-sm text-rose-600">{data.error}</p> : null}
            {data.summary ? <p className="text-sm font-medium text-teal">{data.summary}</p> : null}
            {data.yours ? (
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase text-ink-muted">Referring domains</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {data.yours.referringDomains}
                  </p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase text-ink-muted">Backlinks</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {data.yours.totalBacklinks}
                  </p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase text-ink-muted">Domain rank</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {data.yours.domainRank ?? "—"}
                  </p>
                </div>
              </section>
            ) : null}

            {data.opportunities && data.opportunities.length > 0 ? (
              <section>
                <h2 className="font-display text-lg font-semibold">Link opportunities</h2>
                <ul className="mt-3 divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
                  {data.opportunities.map((o) => (
                    <li key={`${o.domain}-${o.competitor}`} className="px-4 py-3 text-sm">
                      <p className="font-medium text-ink">{o.domain}</p>
                      <p className="text-xs text-ink-muted">{o.reason}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.toxic && data.toxic.length > 0 ? (
              <section>
                <h2 className="font-display text-lg font-semibold">Toxic / low-quality review</h2>
                <ul className="mt-3 divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
                  {data.toxic.map((t) => (
                    <li key={t.sourceUrl || t.sourceDomain} className="px-4 py-3 text-sm">
                      <p className="font-medium text-ink">{t.sourceDomain}</p>
                      <p className="text-xs text-rose-700">{t.reasons.join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="text-sm text-ink-muted">
              Next:{" "}
              <Link href={routes.competitors} className="text-teal hover:underline">
                Competitor compare
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

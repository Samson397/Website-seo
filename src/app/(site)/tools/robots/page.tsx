"use client";

import { useState } from "react";
import { PageHero } from "@/components/ui/PageHero";

interface InspectResult {
  url: string;
  robots: {
    found: boolean;
    content: string | null;
    disallowAll: boolean;
    sitemapDirectives: string[];
  };
  sitemap: {
    found: boolean;
    urlCount: number;
    sampleUrls: string[];
    isIndex: boolean;
  };
}

export default function RobotsToolPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = new FormData(e.currentTarget).get("url") as string;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode: "robots" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Free tool"
        title="robots.txt & sitemap inspector"
        description="See whether crawlers can reach your site and how many URLs your sitemap lists."
      >
        <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            name="url"
            required
            placeholder="example.com"
            className="flex-1 rounded-xl border border-ink/12 bg-white px-4 py-3 text-ink placeholder:text-ink-muted/55 outline-none focus:border-teal focus:ring-2 focus:ring-teal/25"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-ink px-6 py-3 font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
          >
            {loading ? "Checking…" : "Inspect"}
          </button>
        </form>
      </PageHero>

      <div className="mx-auto mt-8 max-w-3xl space-y-6 px-4 sm:px-6">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        )}
        {result && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat
                label="robots.txt"
                value={result.robots.found ? "Found" : "Missing"}
                ok={result.robots.found && !result.robots.disallowAll}
              />
              <Stat
                label="sitemap.xml"
                value={
                  result.sitemap.found
                    ? `${result.sitemap.urlCount}${result.sitemap.isIndex ? "+ (index)" : ""} URLs`
                    : "Missing"
                }
                ok={result.sitemap.found}
              />
            </div>

            {result.robots.disallowAll && (
              <p className="rounded-xl border border-amber-200 bg-amber-soft px-4 py-3 text-sm text-amber-900">
                robots.txt appears to disallow all crawlers (`Disallow: /`).
              </p>
            )}

            {result.robots.content && (
              <pre className="overflow-x-auto rounded-2xl border border-ink/10 bg-ink p-4 text-xs text-teal-soft">
                {result.robots.content}
              </pre>
            )}

            {result.sitemap.sampleUrls.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white p-5">
                <h2 className="font-display text-lg font-semibold text-ink">Sitemap sample</h2>
                <ul className="mt-3 space-y-1 font-mono text-xs text-ink-muted">
                  {result.sitemap.sampleUrls.map((u) => (
                    <li key={u} className="truncate">
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 font-semibold ${ok ? "text-teal" : "text-rose-600"}`}>{value}</p>
    </div>
  );
}

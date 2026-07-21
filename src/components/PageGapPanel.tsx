"use client";

import { useEffect, useState } from "react";
import { formatUrlDisplay } from "@/lib/url-display";
import type { PageGapResult } from "@/lib/page-gap";

interface PageGapPanelProps {
  yourUrl: string;
  competitorUrls: string[];
}

export function PageGapPanel({ yourUrl, competitorUrls }: PageGapPanelProps) {
  const [data, setData] = useState<PageGapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const competitorsKey = competitorUrls.join("|");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/tools/page-gap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yours: yourUrl, competitors: competitorUrls }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Page gap failed");
        if (!cancelled) setData(json as PageGapResult);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Page gap failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (yourUrl && competitorUrls.length > 0) void run();
    return () => {
      cancelled = true;
    };
    // competitorUrls is mirrored by competitorsKey for stable deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yourUrl, competitorsKey]);

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/5 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
          Competitor page gaps
        </p>
        <h3 className="font-display mt-1 text-xl font-semibold text-ink">
          Pages they have that you don’t
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Crawl-first gap check from sitemaps and homepage links — no Google login required.
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {loading ? <p className="text-sm text-ink-muted">Comparing sitemaps…</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {data
          ? data.gaps.map((gap) => (
              <div key={gap.competitor} className="mb-6 last:mb-0">
                <p className="text-sm font-semibold text-ink">{formatUrlDisplay(gap.competitor)}</p>
                <p className="mt-1 text-sm text-teal">{gap.summary}</p>
                {gap.missingPaths.length > 0 ? (
                  <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto font-mono text-xs text-ink-muted">
                    {gap.missingPaths.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          : null}
      </div>
    </div>
  );
}

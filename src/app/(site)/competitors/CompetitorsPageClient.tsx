"use client";

import { useState } from "react";
import { CompetitorUrlInput } from "@/components/CompetitorUrlInput";
import { CompetitorComparisonPanel } from "@/components/CompetitorComparisonPanel";
import type { CompetitorAuditResult } from "@/lib/competitor-scores";
import type { AuditReport } from "@/lib/types";
import { formatUrlDisplay } from "@/lib/url-display";

export default function CompetitorsPageClient() {
  const [results, setResults] = useState<CompetitorAuditResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; url: string } | null>(
    null
  );

  async function auditCompetitors(urls: string[]) {
    setLoading(true);
    setError(null);
    setResults(null);

    const auditResults: CompetitorAuditResult[] = [];

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        setProgress({ current: i + 1, total: urls.length, url });

        try {
          const response = await fetch("/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Homepage-focused for speed when comparing many sites
            body: JSON.stringify({ url, siteCrawl: false }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Audit failed");
          }

          auditResults.push({
            label: formatUrlDisplay((data as AuditReport).url),
            url,
            report: data as AuditReport,
          });
        } catch (err) {
          auditResults.push({
            label: formatUrlDisplay(url),
            url,
            error: err instanceof Error ? err.message : "Audit failed",
          });
        }
      }

      setResults(auditResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <main className="min-h-screen pb-12">
      <section className="hero-mesh px-4 pb-12 pt-28 text-white sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-bright">
            SEOScan
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Compare competitors
          </h1>
          <p className="mt-4 max-w-2xl text-white/75">
            Audit up to 10 public websites side by side. Each site gets the same 50+ homepage
            checks so you can rank gaps quickly.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-glow sm:p-8">
          <CompetitorUrlInput onSubmit={auditCompetitors} loading={loading} progress={progress} />
        </div>

        {loading && !progress && (
          <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-teal border-t-transparent" />
            <p className="font-medium text-ink">Starting competitor audits…</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {results && !loading && (
          <div className="mt-10">
            <CompetitorComparisonPanel results={results} />
          </div>
        )}

        {!results && !loading && (
          <section className="mt-10 border-t border-ink/10 pt-8 text-sm text-ink-muted">
            <h2 className="font-display text-lg font-semibold text-ink">How it works</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>Add competitor domains in your niche.</li>
              <li>Each homepage is scanned with the same check suite.</li>
              <li>Results are ranked by overall score so gaps are obvious.</li>
              <li>Expand any row for the full report.</li>
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { HomeAuthLinks } from "@/components/HomeAuthLinks";
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
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-700 px-4 py-10 text-white sm:px-6">
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute right-0 top-0">
            <HomeAuthLinks />
          </div>
          <div className="flex flex-col items-center text-center">
            <Link href="/" className="mb-4 flex items-center gap-2 text-blue-100 hover:text-white">
              <LogoMark size="sm" />
              <span className="text-sm font-medium">SEOScan</span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Competitor audit</h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Compare other websites side by side — SEO, speed, accessibility, and security scores
              for each competitor, ranked in one table.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
          <CompetitorUrlInput onSubmit={auditCompetitors} loading={loading} progress={progress} />
          <nav className="mt-5 flex justify-center gap-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <Link href="/" className="transition hover:text-blue-600">
              Single site scan
            </Link>
            <Link href="/about" className="transition hover:text-blue-600">
              About
            </Link>
          </nav>
        </div>

        {loading && !progress && (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="font-medium text-slate-700">Starting competitor audits…</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {results && !loading && (
          <div className="mt-10">
            <CompetitorComparisonPanel results={results} />
          </div>
        )}

        {!results && !loading && (
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>Add competitor domains — e.g. rival shops, agencies, or other sites in your niche.</li>
              <li>Each site is scanned independently with the same 50+ checks as a normal SEOScan audit.</li>
              <li>Results are ranked by overall score so you can see who is ahead and where gaps are.</li>
              <li>Click any site in the table to expand its full audit report.</li>
            </ol>
            <p className="mt-4 text-slate-500">
              Tip: only audit public websites you are allowed to scan. This tool does not include
              your own site unless you enter it.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

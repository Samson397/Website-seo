"use client";

import { useState, useRef } from "react";
import { UrlInput } from "@/components/UrlInput";
import { AuditReportView } from "@/components/AuditReport";
import type { AuditReport } from "@/lib/types";

export default function Home() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [previousReport, setPreviousReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUrl = useRef<string>("");
  const lastSiteCrawl = useRef<boolean>(true);

  async function runAudit(url: string, siteCrawl: boolean, isRescan = false) {
    setLoading(true);
    setError(null);

    if (!isRescan) {
      setPreviousReport(null);
      setReport(null);
    } else if (report) {
      setPreviousReport(report);
    }

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, siteCrawl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Audit failed");
      }

      lastUrl.current = url;
      lastSiteCrawl.current = siteCrawl;
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      if (isRescan && previousReport) {
        setReport(previousReport);
        setPreviousReport(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleAudit(url: string, siteCrawl: boolean) {
    runAudit(url, siteCrawl, false);
  }

  function handleRescan() {
    if (lastUrl.current) runAudit(lastUrl.current, lastSiteCrawl.current, true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Website SEO Auditor
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Paste your website URL to find SEO issues, errors, and improvements
          </p>
        </header>

        <UrlInput onSubmit={handleAudit} loading={loading} />

        {loading && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-slate-600">Analyzing your website…</p>
            <p className="mt-1 text-sm text-slate-400">
              Checking SEO, trust signals, content, images, accessibility, security, links, and performance
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {report && !loading && (
          <AuditReportView
            report={report}
            previousReport={previousReport}
            onRescan={handleRescan}
            rescanLoading={loading}
          />
        )}
      </div>
    </main>
  );
}

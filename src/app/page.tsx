"use client";

import { useState } from "react";
import { UrlInput } from "@/components/UrlInput";
import { AuditReportView } from "@/components/AuditReport";
import type { AuditReport } from "@/lib/types";

export default function Home() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAudit(url: string) {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Audit failed");
      }

      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
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
              Checking SEO, accessibility, security, links, and performance
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {report && !loading && <AuditReportView report={report} />}
      </div>
    </main>
  );
}

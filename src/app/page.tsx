"use client";

import { useState, useRef, useEffect } from "react";
import { UrlInput } from "@/components/UrlInput";
import { AuditReportView } from "@/components/AuditReport";
import { SiteChecklistPanel } from "@/components/SiteChecklistPanel";
import { HomeFeatures } from "@/components/HomeFeatures";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { HomeAuthLinks, SaveScanBanner } from "@/components/HomeAuthLinks";
import type { AuditReport } from "@/lib/types";

export default function Home() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [previousReport, setPreviousReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUrl = useRef<string>("");
  const lastSiteCrawl = useRef<boolean>(false);
  const checklistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report?.checklist && checklistRef.current) {
      checklistRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report]);

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
        const msg = data.error || "Audit failed";
        if (msg.includes("timeout") || msg.includes("TIMEOUT") || response.status === 504) {
          throw new Error(
            "The scan took too long. Try again with 'Full site scan' unchecked for a faster result."
          );
        }
        throw new Error(msg);
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
    if (lastUrl.current) {
      runAudit(lastUrl.current, lastSiteCrawl.current, true);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-8">
      {/* Hero — compact on mobile so the form is never covered */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 px-4 pb-8 pt-10 text-white sm:px-6 sm:pb-24 sm:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="absolute right-0 top-0">
            <HomeAuthLinks />
          </div>
          <div className="mb-4 flex justify-center sm:mb-5">
            <LogoMark size="md" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">SEOScan</h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-blue-100 sm:mt-4 sm:text-lg">
            Enter your website — just the domain is fine, e.g. yourwebsite.com
          </p>
          <p className="mt-3 text-xs text-blue-200/90 sm:hidden">
            Free · 35+ checks · <Link href="/register" className="underline">Save &amp; monitor</Link>
          </p>
          <div className="mt-5 hidden flex-wrap justify-center gap-2 text-sm sm:flex">
            {["Free forever", "35+ checks", "Uptime monitoring", "Weekly SEO scans"].map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20 backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Search card — below hero on mobile, slight overlap on desktop only */}
        <div className="relative z-10 mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 sm:-mt-14 sm:p-8">
          <UrlInput onSubmit={handleAudit} loading={loading} />
          <nav className="mt-5 flex justify-center gap-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <Link href="/about" className="transition hover:text-blue-600">
              About
            </Link>
            <Link href="/privacy" className="transition hover:text-blue-600">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-blue-600">
              Terms
            </Link>
          </nav>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="font-medium text-slate-700">Scanning your website…</p>
            <p className="mt-1 text-sm text-slate-400">Usually 20–40 seconds</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {report && !loading && (
          <div className="mt-10 space-y-8 pb-12">
            <SaveScanBanner url={report.url} report={report} siteCrawl={lastSiteCrawl.current} />
            {report.checklist && (
              <div ref={checklistRef} id="what-you-have">
                <SiteChecklistPanel checklist={report.checklist} />
              </div>
            )}
            <AuditReportView
              report={report}
              previousReport={previousReport}
              onRescan={handleRescan}
              rescanLoading={loading}
            />
          </div>
        )}

        {!report && !loading && <HomeFeatures />}
      </div>
    </main>
  );
}

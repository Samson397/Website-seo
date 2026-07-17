"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { UrlInput } from "@/components/UrlInput";
import { AuditReportView } from "@/components/AuditReport";
import { ProblemsSummary } from "@/components/ProblemsSummary";
import { ChecksPanel } from "@/components/ChecksPanel";
import { HomeFeatures } from "@/components/HomeFeatures";
import { RouteCards } from "@/components/RouteCards";
import { routes } from "@/lib/routes";
import type { AuditReport, AuditCategory } from "@/lib/types";

export default function Home() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [previousReport, setPreviousReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUrl = useRef<string>("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const [issueFilter, setIssueFilter] = useState<AuditCategory | "all">("all");

  async function runAudit(url: string, isRescan = false) {
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
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = data.error || "Audit failed";
        if (msg.includes("timeout") || msg.includes("TIMEOUT") || response.status === 504) {
          throw new Error(
            "The scan took too long on this host. Try again in a moment — large sites can take up to a minute."
          );
        }
        throw new Error(msg);
      }

      lastUrl.current = url;
      setReport(data);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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

  function handleRescan() {
    if (lastUrl.current) runAudit(lastUrl.current, true);
  }

  return (
    <main className="min-h-screen pb-16">
      <section className="hero-mesh relative overflow-hidden px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <p className="animate-rise text-xs font-semibold uppercase tracking-[0.22em] text-teal-bright">
            SEOScan
          </p>
          <h1 className="font-display animate-rise-delay-1 mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            See every page.
            <span className="block text-teal-bright">Fix what search sees.</span>
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-xl text-base text-white/75 sm:text-lg">
            Paste a URL. We crawl your full site and run 50+ SEO, security, speed, and
            accessibility checks — free, no account.
          </p>

          <div className="animate-rise-delay-2 glass-panel mt-8 max-w-2xl rounded-2xl border border-white/15 p-4 shadow-glow sm:p-5">
            <UrlInput onSubmit={(url) => runAudit(url)} loading={loading} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="relative -mt-8 rounded-2xl border border-ink/10 bg-white p-10 text-center shadow-sm">
            <div className="scan-pulse relative mx-auto mb-5 h-12 w-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal border-t-transparent" />
            </div>
            <p className="font-display text-xl font-semibold text-ink">Crawling your site…</p>
            <p className="mt-2 text-sm text-ink-muted">
              Finding pages from sitemap &amp; links, then checking each one. Large sites may take
              up to a minute.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {report && !loading && (
          <div ref={resultsRef} className="mt-10 space-y-8 pb-12">
            <ProblemsSummary
              report={report}
              onJumpToCategory={(category) => {
                setIssueFilter(category);
                document
                  .getElementById("audit-issues")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
            {report.checklist && <ChecksPanel checklist={report.checklist} />}
            <AuditReportView
              report={report}
              previousReport={previousReport}
              onRescan={handleRescan}
              rescanLoading={loading}
              showProblemsSummary={false}
              categoryFilter={issueFilter}
              onCategoryFilterChange={setIssueFilter}
            />
          </div>
        )}

        {!report && !loading && (
          <>
            <RouteCards />
            <HomeFeatures />
            <section className="mt-12 rounded-2xl border border-ink/10 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
              <h2 className="font-display text-2xl font-semibold text-ink">More free tools</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
                Quick utilities that reuse the same audit engine — no login required.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ToolLink href={routes.metaPreview} label="Meta & SERP preview" />
                <ToolLink href={routes.robotsInspector} label="robots.txt & sitemap" />
                <ToolLink href={routes.headers} label="Security headers" />
                <ToolLink href={routes.competitors} label="Competitor compare" />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-ink/10 bg-paper px-4 py-2.5 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-teal-soft"
    >
      {label}
    </Link>
  );
}

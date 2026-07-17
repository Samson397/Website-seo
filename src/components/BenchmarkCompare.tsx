"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AuditReport } from "@/lib/types";
import { routes } from "@/lib/routes";

interface Benchmarks {
  sampleSize: number;
  avgOverall: number;
  avgSeo: number;
  avgPerformance: number;
  avgAccessibility: number;
  avgSecurity: number;
  source: "live" | "seed";
}

interface BenchmarkCompareProps {
  report: AuditReport;
}

export function BenchmarkCompare({ report }: BenchmarkCompareProps) {
  const [bench, setBench] = useState<Benchmarks | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/benchmarks")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setBench(data);
      })
      .catch(() => {
        if (!cancelled) setBench(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const overall = Math.round(
    (report.scores.seo +
      report.scores.performance +
      report.scores.accessibility +
      report.scores.security) /
      4
  );

  if (!bench) return null;

  const delta = overall - bench.avgOverall;

  return (
    <section className="rounded-2xl border border-ink/10 bg-gradient-to-br from-ink to-ink-soft px-5 py-5 text-white sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-bright">
        Why come back
      </p>
      <h3 className="font-display mt-2 text-xl font-semibold">
        Your score {overall} vs network average {bench.avgOverall}
      </h3>
      <p className="mt-2 text-sm text-white/70">
        {delta >= 0
          ? `You're ${delta} points above the SEOScan network average.`
          : `You're ${Math.abs(delta)} points below the SEOScan network average — fix the failed checks and re-scan.`}{" "}
        {bench.source === "live" && bench.sampleSize > 0
          ? `Based on ${bench.sampleSize.toLocaleString()} recent public scans.`
          : "Averages refine as more sites are scanned."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label="SEO" you={report.scores.seo} avg={bench.avgSeo} />
        <Mini label="Speed" you={report.scores.performance} avg={bench.avgPerformance} />
        <Mini label="A11y" you={report.scores.accessibility} avg={bench.avgAccessibility} />
        <Mini label="Security" you={report.scores.security} avg={bench.avgSecurity} />
      </div>
      <Link
        href={routes.benchmarks}
        className="mt-4 inline-block text-sm font-medium text-teal-bright hover:underline"
      >
        View live benchmarks →
      </Link>
    </section>
  );
}

function Mini({ label, you, avg }: { label: string; you: number; avg: number }) {
  const up = you >= avg;
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <p className="text-[10px] uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">
        {you}{" "}
        <span className={`text-xs font-medium ${up ? "text-teal-bright" : "text-amber-300"}`}>
          {up ? "▲" : "▼"} avg {avg}
        </span>
      </p>
    </div>
  );
}

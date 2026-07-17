"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmailCapture } from "@/components/EmailCapture";
import { AdSlot } from "@/components/AdSlot";
import { routes } from "@/lib/routes";

interface Benchmarks {
  sampleSize: number;
  avgOverall: number;
  avgSeo: number;
  avgPerformance: number;
  avgAccessibility: number;
  avgSecurity: number;
  avgFailCount: number;
  topTlds: { tld: string; count: number }[];
  recentHosts: { hostname: string; overall: number; scannedAt: string }[];
  source: "live" | "seed";
}

export default function BenchmarksPage() {
  const [data, setData] = useState<Benchmarks | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/benchmarks")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Could not load benchmarks"));
  }, []);

  return (
    <main className="min-h-screen pb-16">
      <section className="hero-mesh px-4 pb-14 pt-28 text-white sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-bright">
            Network pulse
          </p>
          <h1 className="font-display mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Live SEOScan benchmarks
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Anonymized averages from public websites scanned on SEOScan. Re-check your site weekly
            and see if you’re beating the network.
          </p>
          <Link
            href={routes.home}
            className="mt-6 inline-flex rounded-xl bg-teal-bright px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Scan your site
          </Link>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-6xl space-y-8 px-4 sm:px-6">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        )}

        {data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Sample (90d)" value={data.sampleSize.toLocaleString()} />
              <Stat label="Avg overall" value={String(data.avgOverall)} />
              <Stat label="Avg SEO" value={String(data.avgSeo)} />
              <Stat label="Avg security" value={String(data.avgSecurity)} />
              <Stat label="Avg failed checks" value={String(data.avgFailCount)} />
            </div>
            <p className="text-xs text-ink-muted">
              Source: {data.source === "live" ? "live scan network" : "seed averages until enough scans accumulate"}.
              Hostnames shown are public websites that were scanned — not personal accounts.
            </p>

            <AdSlot />

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-ink/10 bg-white p-5">
                <h2 className="font-display text-lg font-semibold text-ink">Top TLDs scanned</h2>
                <ul className="mt-4 space-y-2">
                  {data.topTlds.map((t) => (
                    <li key={t.tld} className="flex justify-between text-sm">
                      <span className="font-mono text-ink">.{t.tld}</span>
                      <span className="text-ink-muted">{t.count}</span>
                    </li>
                  ))}
                  {data.topTlds.length === 0 && (
                    <li className="text-sm text-ink-muted">No TLD data yet — run more scans.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-5">
                <h2 className="font-display text-lg font-semibold text-ink">
                  Recent public scores
                </h2>
                <ul className="mt-4 space-y-2">
                  {data.recentHosts.map((h) => (
                    <li key={`${h.hostname}-${h.scannedAt}`} className="flex justify-between text-sm">
                      <span className="truncate font-medium text-ink">{h.hostname}</span>
                      <span className="shrink-0 font-semibold text-teal">{h.overall}</span>
                    </li>
                  ))}
                  {data.recentHosts.length === 0 && (
                    <li className="text-sm text-ink-muted">
                      Scores appear here as the network grows.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Avg performance" value={String(data.avgPerformance)} />
              <Stat label="Avg accessibility" value={String(data.avgAccessibility)} />
              <Stat label="Data window" value="90 days" />
              <Stat label="Personal data sold" value="Never" />
            </div>
          </>
        )}

        <EmailCapture
          source="benchmarks"
          headline="Get benchmark digests"
          subcopy="Occasional email when network averages move. Consent required — we don’t sell your email."
        />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="font-display mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

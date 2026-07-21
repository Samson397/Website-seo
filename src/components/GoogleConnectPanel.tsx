"use client";

import { useEffect, useState } from "react";

type GscPayload = {
  connected: boolean;
  connectUrl?: string;
  configured?: boolean;
  siteUrl?: string | null;
  totals?: {
    clicks28d: number;
    impressions28d: number;
    ctr28d: number;
    position28d: number;
  };
  topQueries?: Array<{ query: string; clicks: number; position: number }>;
  error?: string;
};

export function GoogleConnectPanel({ siteUrl }: { siteUrl?: string }) {
  const [data, setData] = useState<GscPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const qs = siteUrl ? `?url=${encodeURIComponent(siteUrl)}` : "";
      const res = await fetch(`/api/tools/gsc-site${qs}`, { cache: "no-store" });
      const json = (await res.json()) as GscPayload;
      if (!cancelled) setData(json);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [siteUrl]);

  if (!data) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white px-5 py-4 text-sm text-ink-muted">
        Checking Google connection…
      </section>
    );
  }

  if (!data.connected) {
    return (
      <section className="rounded-2xl border border-dashed border-ink/15 bg-mist/40 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Optional</p>
        <h3 className="font-display mt-1 text-lg font-semibold text-ink">
          Connect Google Search Console
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Not required for audits. Connect only if you want private clicks, impressions, and query
          data for sites you own.
        </p>
        <a
          href={data.connectUrl || "/api/auth/google/connect"}
          className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
        >
          Connect Google
        </a>
      </section>
    );
  }

  if (data.error || !data.configured) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white px-5 py-5">
        <p className="text-sm font-semibold text-ink">Google connected</p>
        <p className="mt-1 text-sm text-ink-muted">
          {data.error ||
            "Connected, but this URL may not be a verified Search Console property on your account."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-teal/25 bg-teal-soft/20 px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Search Console</p>
      <h3 className="font-display mt-1 text-lg font-semibold text-ink">
        {data.siteUrl || "Your property"}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-ink-muted">Clicks (28d)</p>
          <p className="font-display text-xl font-semibold">{data.totals?.clicks28d ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Impressions</p>
          <p className="font-display text-xl font-semibold">{data.totals?.impressions28d ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">CTR</p>
          <p className="font-display text-xl font-semibold">
            {((data.totals?.ctr28d ?? 0) * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Avg position</p>
          <p className="font-display text-xl font-semibold">
            {(data.totals?.position28d ?? 0).toFixed(1)}
          </p>
        </div>
      </div>
      {data.topQueries && data.topQueries.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm text-ink-muted">
          {data.topQueries.slice(0, 5).map((q) => (
            <li key={q.query}>
              {q.query} · {q.clicks} clicks · pos {q.position.toFixed(1)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

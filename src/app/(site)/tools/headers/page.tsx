"use client";

import { useState } from "react";

interface HeadersResult {
  url: string;
  status: number;
  https: boolean;
  headers: Record<string, string | null>;
  present: number;
  total: number;
}

const LABELS: Record<string, string> = {
  "strict-transport-security": "HSTS",
  "content-security-policy": "Content-Security-Policy",
  "x-frame-options": "X-Frame-Options",
  "x-content-type-options": "X-Content-Type-Options",
  "referrer-policy": "Referrer-Policy",
  "permissions-policy": "Permissions-Policy",
  "feature-policy": "Feature-Policy",
  "cross-origin-opener-policy": "COOP",
  "cross-origin-resource-policy": "CORP",
  "x-xss-protection": "X-XSS-Protection",
};

export default function HeadersToolPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HeadersResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = new FormData(e.currentTarget).get("url") as string;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode: "headers" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-16">
      <section className="border-b border-ink/10 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Free tool</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
            Security headers checker
          </h1>
          <p className="mt-3 text-ink-muted">
            Quickly see which browser security headers your site returns.
          </p>
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              name="url"
              required
              placeholder="example.com"
              className="flex-1 rounded-xl border border-ink/10 px-4 py-3 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-teal px-6 py-3 font-semibold text-white hover:bg-teal-bright disabled:opacity-60"
            >
              {loading ? "Checking…" : "Check headers"}
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-3xl space-y-4 px-4 sm:px-6">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        )}
        {result && (
          <>
            <p className="text-sm text-ink-muted">
              {result.url} · HTTP {result.status} · {result.present}/{result.total} headers present
              {!result.https && " · not HTTPS"}
            </p>
            <ul className="divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
              {Object.entries(result.headers).map(([key, value]) => (
                <li key={key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                  <span className="font-medium text-ink">{LABELS[key] || key}</span>
                  <span
                    className={`break-all text-sm ${value ? "text-teal" : "text-rose-600"}`}
                  >
                    {value || "Missing"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

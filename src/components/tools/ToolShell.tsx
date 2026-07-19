"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  placeholder?: string;
  endpoint: string;
  /** Shown before the first successful run */
  idleHint?: ReactNode;
  children: (data: unknown) => ReactNode;
};

export function ToolShell({
  eyebrow,
  title,
  description,
  placeholder = "https://example.com",
  endpoint,
  idleHint,
  children,
}: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <form
          onSubmit={onSubmit}
          className="glass-panel flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="w-full flex-1 rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60"
          >
            {loading ? "Checking…" : "Run check"}
          </button>
        </form>
        {!data && !error && idleHint ? (
          <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 px-4 py-3 text-sm text-ink-muted">
            {idleHint}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {data ? (
          <>
            <div className="animate-rise mt-8">{children(data)}</div>
            <div className="mt-10 rounded-2xl border border-ink/10 bg-white px-5 py-5 text-center">
              <p className="text-sm text-ink-muted">
                Want the full Pass/Fail checklist across your site?
              </p>
              <Link
                href={routes.home}
                className="mt-3 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
              >
                Run a free homepage scan
              </Link>
              <p className="mt-3 text-xs text-ink-muted">
                Or browse{" "}
                <Link href={routes.tools} className="text-brand hover:underline">
                  more free tools
                </Link>
                .
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

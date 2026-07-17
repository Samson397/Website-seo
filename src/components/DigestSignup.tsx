"use client";

import { FormEvent, useState } from "react";
import type { WatchItem } from "@/lib/local-history";

export function DigestSignup({ watchlist }: { watchlist: WatchItem[] }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (watchlist.length === 0) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/digest/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sites: watchlist.map((w) => ({
            url: w.url,
            hostname: w.hostname,
            lastOverall: w.lastOverall,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Weekly digest</p>
      <h2 className="font-display mt-1 text-xl font-semibold text-ink">
        Email me my watchlist every week
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        Optional Reminder via Resend — unsubscribe anytime. Uses your current watchlist (
        {watchlist.length} site{watchlist.length === 1 ? "" : "s"}).
      </p>
      {status === "done" ? (
        <p className="mt-4 text-sm font-medium text-teal">You’re signed up. Check your inbox for confirmation.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="flex-1 rounded-xl border border-ink/10 bg-paper px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "saving" ? "Saving…" : "Get weekly email"}
          </button>
        </form>
      )}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </section>
  );
}

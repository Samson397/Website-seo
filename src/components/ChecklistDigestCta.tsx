"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";

function hostnameFromUrl(raw: string): string | null {
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProto);
    if (!u.hostname || !u.hostname.includes(".")) return null;
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Lead capture for the Technical SEO checklist page.
 * Reuses /api/digest/subscribe with a single site (same API as DigestSignup).
 */
export function ChecklistDigestCta() {
  const [email, setEmail] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);

    const hostname = hostnameFromUrl(siteUrl.trim());
    if (!hostname) {
      setStatus("error");
      setError("Enter a valid site URL (e.g. example.com).");
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(siteUrl.trim())
      ? siteUrl.trim()
      : `https://${siteUrl.trim()}`;

    try {
      const res = await fetch("/api/digest/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          sites: [{ url: normalizedUrl, hostname }],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white px-5 py-6 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Weekly digest</p>
      <h2 className="font-display mt-1 text-xl font-semibold text-ink sm:text-2xl">
        Get a weekly reminder to re-check your site
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        Enter your email and a site URL. We use the same digest signup as{" "}
        <Link href={routes.history} className="font-medium text-teal hover:underline">
          History
        </Link>{" "}
        — optional email via Resend, unsubscribe anytime. Prefer managing a full watchlist? Add
        sites on History, then subscribe there.
      </p>

      {status === "done" ? (
        <p className="mt-4 text-sm font-medium text-teal">
          You&apos;re signed up. Check your inbox for confirmation, then{" "}
          <Link href={routes.home} className="underline">
            run a free scan
          </Link>{" "}
          when you&apos;re ready.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 rounded-xl border border-ink/10 bg-paper px-4 py-2.5 text-sm"
              autoComplete="email"
            />
            <input
              type="text"
              required
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="example.com"
              className="flex-1 rounded-xl border border-ink/10 bg-paper px-4 py-2.5 text-sm"
              autoComplete="url"
            />
          </div>
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:self-start"
          >
            {status === "saving" ? "Saving…" : "Get weekly digest"}
          </button>
        </form>
      )}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

interface EmailCaptureProps {
  source?: "report" | "benchmarks" | "footer" | "tools";
  hostname?: string;
  headline?: string;
  subcopy?: string;
}

export function EmailCapture({
  source = "report",
  hostname,
  headline = "Get your score changes by email",
  subcopy = "Optional. We’ll send scan tips and (if you opt in) product updates. No account needed.",
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setMessage("Tick the consent box to continue.");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          hostname,
          consent: true,
          marketingOptIn: marketing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save email");
      setStatus("done");
      setMessage("Saved. You’re on the list.");
      setEmail("");
      setConsent(false);
      setMarketing(false);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-teal/30 bg-teal-soft/40 px-5 py-4 text-sm text-teal">
        {message}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white px-5 py-5 shadow-sm sm:px-6">
      <h3 className="font-display text-lg font-semibold text-ink">{headline}</h3>
      <p className="mt-1 text-sm text-ink-muted">{subcopy}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
        <label className="flex items-start gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal focus:ring-teal"
          />
          <span>
            I agree SEOScan may store my email to send the report follow-up I requested. See the{" "}
            <Link href="/privacy" className="text-teal underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal focus:ring-teal"
          />
          <span>Also send occasional SEO tips and product updates (optional).</span>
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {status === "loading" ? "Saving…" : "Email me updates"}
        </button>
        {message && status === "error" && (
          <p className="text-sm text-rose-600">{message}</p>
        )}
      </form>
    </section>
  );
}

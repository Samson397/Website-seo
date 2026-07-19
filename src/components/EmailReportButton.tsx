"use client";

import { FormEvent, useState } from "react";
import type { AuditReport } from "@/lib/types";

export function EmailReportButton({ report }: { report: AuditReport }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [marketingOk, setMarketingOk] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/email/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, report, marketingOk }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setStatus("sent");
      setTimeout(() => {
        setStatus("idle");
        setOpen(false);
        setMarketingOk(false);
      }, 2500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Send failed");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal/40 hover:bg-teal-soft"
      >
        Email report
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-2 sm:max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Sent" : "Send"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-xl bg-mist px-3 py-2 text-sm text-ink-muted"
        >
          Cancel
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          checked={marketingOk}
          onChange={(e) => setMarketingOk(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Also send me occasional SEO tips and product updates to help improve my site (unsubscribe
          anytime).
        </span>
      </label>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {status === "sent" ? (
        <p className="text-xs text-teal">Report emailed. Check your inbox.</p>
      ) : (
        <p className="text-xs text-ink-muted">
          We use your address to send this report
          {marketingOk ? " and optional tips" : ""}. We don’t sell your email.
        </p>
      )}
    </form>
  );
}

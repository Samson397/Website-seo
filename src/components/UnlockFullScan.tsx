"use client";

import { useState } from "react";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";

interface UnlockFullScanProps {
  url?: string;
  variant?: "banner" | "inline";
  onUnlocked?: () => void;
}

export function UnlockFullScan({ url, variant = "banner" }: UnlockFullScanProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          returnPath: url ? `/?url=${encodeURIComponent(url)}` : "/",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (variant === "inline") {
    return (
      <div>
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={loading}
          className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-bright disabled:opacity-60"
        >
          {loading ? "Opening checkout…" : `Unlock full scan — ${FULL_SCAN_PRICE_LABEL}`}
        </button>
        {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal/25 bg-gradient-to-br from-ink to-ink-soft px-5 py-5 text-white shadow-glow sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-bright">
        Free preview
      </p>
      <h3 className="font-display mt-2 text-xl font-semibold sm:text-2xl">
        Unlock the full site SEO scan
      </h3>
      <p className="mt-2 max-w-xl text-sm text-white/75">
        Free checks cover the homepage. For {FULL_SCAN_PRICE_LABEL} get a crawl of up to 200 pages,
        full Pass/Fail checklist, shareable report, and deeper site-wide issues.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={loading}
          className="rounded-xl bg-teal-bright px-5 py-2.5 text-sm font-semibold text-ink hover:bg-teal disabled:opacity-60"
        >
          {loading ? "Opening checkout…" : `Pay ${FULL_SCAN_PRICE_LABEL} — unlock full SEO`}
        </button>
        <span className="text-xs text-white/50">One-time · no account · Stripe Checkout</span>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

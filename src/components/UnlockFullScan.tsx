"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaymentsEnabled } from "@/hooks/usePaymentsEnabled";
import { routes } from "@/lib/routes";

interface UnlockFullScanProps {
  url?: string;
  variant?: "banner" | "inline";
}

export function UnlockFullScan({ url, variant = "banner" }: UnlockFullScanProps) {
  const { enabled, priceLabel, ready } = usePaymentsEnabled();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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

  if (ready && !enabled) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-soft/50 px-5 py-4 text-sm text-amber-950">
        Payments aren’t live on this deployment yet. Add Stripe keys in Vercel → Environment
        Variables, then redeploy.{" "}
        <Link href={routes.pricing} className="font-medium underline">
          See what’s included
        </Link>
        .
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div>
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={loading || !ready}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60"
        >
          {loading ? "Opening checkout…" : `Unlock full scan — ${priceLabel}`}
        </button>
        {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-ink px-5 py-6 text-white sm:px-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
        Free preview
      </p>
      <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Unlock the full site SEO scan
      </h3>
      <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
        Free covers the homepage. Pay {priceLabel} once for a crawl of up to 200 pages, full
        Pass/Fail checklist, shareable report, and site-wide issues — no account.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={loading || !ready}
          className="rounded-xl bg-brand-bright px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-60"
        >
          {loading ? "Opening checkout…" : `Pay ${priceLabel} — unlock full SEO`}
        </button>
        <Link href={routes.pricing} className="text-xs text-white/55 hover:text-white">
          Compare free vs full
        </Link>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

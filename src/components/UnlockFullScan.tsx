"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePaymentsEnabled } from "@/hooks/usePaymentsEnabled";
import { saveUnlock } from "@/lib/unlock";
import { routes, scanUrlFor } from "@/lib/routes";
import { PromoCodesBoard, notifyPromoRedeemed } from "@/components/PromoCodesBoard";

interface UnlockFullScanProps {
  url?: string;
  variant?: "banner" | "inline";
}

export function UnlockFullScan({ url, variant = "banner" }: UnlockFullScanProps) {
  const { enabled, priceLabel, ready } = usePaymentsEnabled();
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");

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

  async function redeemPromo(e?: FormEvent) {
    e?.preventDefault();
    const code = promoCode.trim();
    if (!code) {
      setError("Enter a promo code.");
      return;
    }
    setPromoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not redeem code");
      saveUnlock(data.sessionId as string);
      if (
        typeof data.usedCount === "number" &&
        typeof data.remaining === "number" &&
        typeof data.maxUses === "number"
      ) {
        notifyPromoRedeemed({
          code: String(data.code || code),
          usedCount: data.usedCount,
          remaining: data.remaining,
          maxUses: data.maxUses,
        });
      } else {
        notifyPromoRedeemed();
      }
      // Brief pause so the counter can paint before navigation
      await new Promise((r) => window.setTimeout(r, 450));
      window.location.href = scanUrlFor(url || "", data.sessionId as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem code");
      setPromoLoading(false);
    }
  }

  // Checkout-style optional code field — works anytime; launch board above only when pool remains.
  const promoForm = (
    <div className="mt-4 space-y-2">
      <p
        className={
          variant === "banner"
            ? "text-xs text-white/55"
            : "text-xs text-ink-muted"
        }
      >
        Have a promo code?
      </p>
      <form onSubmit={(e) => void redeemPromo(e)} className="flex flex-wrap gap-2">
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          placeholder="Promo code"
          autoComplete="off"
          spellCheck={false}
          className={
            variant === "banner"
              ? "min-w-[10rem] flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 font-mono text-sm uppercase tracking-wide text-white placeholder:text-white/40 focus:border-brand-bright focus:outline-none"
              : "min-w-[10rem] flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wide text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
          }
        />
        <button
          type="submit"
          disabled={promoLoading}
          className={
            variant === "banner"
              ? "rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
              : "rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand/40 disabled:opacity-60"
          }
        >
          {promoLoading ? "Applying…" : "Apply code"}
        </button>
      </form>
    </div>
  );

  if (ready && !enabled) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-soft/50 px-5 py-4 text-sm text-amber-950">
          Stripe isn’t live on this deployment yet. You can still try a promo code below, or{" "}
          <Link href={routes.pricing} className="font-medium underline">
            see pricing
          </Link>
          .
        </div>
        {promoForm}
        <PromoCodesBoard />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void checkout()}
            disabled={loading || !ready}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60"
          >
            {loading ? "Opening checkout…" : `Unlock report — ${priceLabel}`}
          </button>
        </div>
        {promoForm}
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-ink px-5 py-6 text-white sm:px-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
        Free preview
      </p>
      <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Unlock this report
      </h3>
      <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
        Pay {priceLabel} for this full-site scan — unlock fixes instantly, crawl up to 200 pages,
        export, and get a shareable link. One scan per payment. No account.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={loading || !ready}
          className="rounded-xl bg-brand-bright px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-60"
        >
          {loading ? "Opening checkout…" : `Pay ${priceLabel} — unlock`}
        </button>
        <Link href={routes.pricing} className="text-xs text-white/55 hover:text-white">
          Compare free vs full
        </Link>
      </div>
      <div className="mt-5 border-t border-white/10 pt-5">
        <PromoCodesBoard compact />
        {promoForm}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

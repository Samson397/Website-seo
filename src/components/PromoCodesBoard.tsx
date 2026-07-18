"use client";

import { useCallback, useEffect, useState } from "react";

export interface PromoCodeRow {
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  remaining: number;
  active: boolean;
}

type PromoSnapshot = {
  code: string;
  usedCount: number;
  maxUses: number;
  remaining: number;
};

/** Live board for the launch pass — first N free unlocks, 1 per IP. */
export function PromoCodesBoard({ compact = false }: { compact?: boolean }) {
  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback((snap: PromoSnapshot) => {
    setCodes((prev) => {
      if (!prev.length) {
        return [
          {
            code: snap.code,
            label: "First 100 free unlocks",
            maxUses: snap.maxUses,
            usedCount: snap.usedCount,
            remaining: snap.remaining,
            active: true,
          },
        ];
      }
      return prev.map((c) =>
        c.code === snap.code
          ? {
              ...c,
              usedCount: snap.usedCount,
              maxUses: snap.maxUses,
              remaining: snap.remaining,
            }
          : c
      );
    });
    setEnabled(true);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/promo?t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      const data = await res.json();
      setEnabled(Boolean(data.enabled));
      setCodes(Array.isArray(data.codes) ? data.codes : []);
      setError(null);
    } catch {
      setError("Could not load free unlock status.");
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 12_000);
    const onFocus = () => void load();
    const onRedeemed = (event: Event) => {
      const detail = (event as CustomEvent<PromoSnapshot>).detail;
      if (detail?.code) applySnapshot(detail);
      else void load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("seohub:promo-redeemed", onRedeemed as EventListener);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("seohub:promo-redeemed", onRedeemed as EventListener);
    };
  }, [load, applySnapshot]);

  if (enabled === false && codes.length === 0) {
    return null;
  }

  if (enabled === null && codes.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        {compact ? "Loading…" : "Loading free unlock status…"}
      </p>
    );
  }

  if (!codes.length) return null;

  const primary = codes[0];
  const gone = primary.remaining <= 0;
  const pct =
    primary.maxUses > 0 ? Math.min(100, (primary.usedCount / primary.maxUses) * 100) : 100;

  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      {!compact ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Launch pass
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold text-ink">
            First {primary.maxUses} full unlocks free
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Use code <span className="font-mono font-semibold text-ink">{primary.code}</span> for
            one full-site scan — no Stripe. One claim per network (IP). Counts update live.
          </p>
        </div>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-bright/90">
          Or claim a free launch unlock
        </p>
      )}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div
        className={
          compact
            ? "rounded-xl border border-white/15 bg-white/5 px-3 py-3"
            : "max-w-md rounded-2xl border border-ink/10 bg-white px-5 py-5"
        }
      >
        <div className="flex items-baseline justify-between gap-2">
          <code
            className={`font-mono text-base font-semibold tracking-wide ${
              compact ? "text-white" : "text-ink"
            }`}
          >
            {primary.code}
          </code>
          <span
            className={`text-sm font-semibold ${
              gone
                ? compact
                  ? "text-rose-300"
                  : "text-rose-600"
                : compact
                  ? "text-brand-bright"
                  : "text-brand"
            }`}
          >
            {gone ? "Fully claimed" : `${primary.remaining} left`}
          </span>
        </div>
        <p className={`mt-1 text-xs ${compact ? "text-white/55" : "text-ink-muted"}`}>
          {primary.usedCount}/{primary.maxUses} claimed · 1 per IP
        </p>
        <div
          className={`mt-3 h-2 overflow-hidden rounded-full ${compact ? "bg-white/10" : "bg-mist"}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              gone ? "bg-rose-400" : compact ? "bg-brand-bright" : "bg-brand"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export function notifyPromoRedeemed(snapshot?: PromoSnapshot) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("seohub:promo-redeemed", {
      detail: snapshot,
    })
  );
}

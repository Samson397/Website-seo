"use client";

import { useCallback, useEffect, useState } from "react";

interface PromoCodeRow {
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  remaining: number;
  active: boolean;
}

/** Live board of public promo codes — updates when codes are redeemed. */
export function PromoCodesBoard({ compact = false }: { compact?: boolean }) {
  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/promo", { cache: "no-store" });
      const data = await res.json();
      setEnabled(Boolean(data.enabled));
      setCodes(Array.isArray(data.codes) ? data.codes : []);
      setError(null);
    } catch {
      setError("Could not load promo codes.");
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 20_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("seohub:promo-redeemed", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("seohub:promo-redeemed", onFocus);
    };
  }, [load]);

  if (enabled === false && codes.length === 0) {
    return null;
  }

  if (enabled === null && codes.length === 0) {
    return (
      <p className="text-sm text-ink-muted">{compact ? "Loading codes…" : "Loading promo codes…"}</p>
    );
  }

  if (!codes.length) return null;

  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      {!compact ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Free unlock codes
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold text-ink">
            Skip Stripe with a pass
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Limited codes for friends and early users. Each redeem unlocks one full-site scan.
            Counts update live when someone uses a code.
          </p>
        </div>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-bright/90">
          Or use a free pass
        </p>
      )}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <ul className={compact ? "space-y-2" : "grid gap-3 sm:grid-cols-3"}>
        {codes.map((c) => {
          const gone = c.remaining <= 0;
          const pct = c.maxUses > 0 ? Math.min(100, (c.usedCount / c.maxUses) * 100) : 100;
          return (
            <li
              key={c.code}
              className={
                compact
                  ? "rounded-xl border border-white/15 bg-white/5 px-3 py-2.5"
                  : "rounded-2xl border border-ink/10 bg-white px-4 py-4"
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <code
                  className={`font-mono text-sm font-semibold tracking-wide ${
                    compact ? "text-white" : "text-ink"
                  }`}
                >
                  {c.code}
                </code>
                <span
                  className={`text-xs font-medium ${
                    gone
                      ? compact
                        ? "text-rose-300"
                        : "text-rose-600"
                      : compact
                        ? "text-brand-bright"
                        : "text-brand"
                  }`}
                >
                  {gone ? "Used up" : `${c.remaining} left`}
                </span>
              </div>
              <p className={`mt-1 text-xs ${compact ? "text-white/55" : "text-ink-muted"}`}>
                {c.label} · {c.usedCount}/{c.maxUses} used
              </p>
              <div
                className={`mt-2 h-1.5 overflow-hidden rounded-full ${
                  compact ? "bg-white/10" : "bg-mist"
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    gone ? "bg-rose-400" : compact ? "bg-brand-bright" : "bg-brand"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function notifyPromoRedeemed() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("seohub:promo-redeemed"));
  }
}

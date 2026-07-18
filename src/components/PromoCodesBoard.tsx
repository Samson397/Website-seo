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

/** Quiet launch-offer status — not a promo banner or scarcity card. */
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
    return compact ? null : <p className="text-sm text-ink-muted">Checking launch offer…</p>;
  }

  const available = codes.filter((c) => c.remaining > 0);
  if (!available.length) return null;

  const primary = available[0];

  if (compact) {
    return (
      <p className="text-sm text-white/70">
        Launch code{" "}
        <code className="font-mono font-semibold text-white">{primary.code}</code>
        {" · "}
        {primary.remaining} free unlock{primary.remaining === 1 ? "" : "s"} left
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <p className="text-sm leading-relaxed text-ink-muted">
        Launch offer: code{" "}
        <code className="font-mono font-semibold text-ink">{primary.code}</code> unlocks one
        full-site scan — no Stripe. {primary.remaining} of {primary.maxUses} remaining · one claim
        per network.
      </p>
    </div>
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

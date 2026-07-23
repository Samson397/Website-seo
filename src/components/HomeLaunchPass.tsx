"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { saveUnlock } from "@/lib/unlock";
import { scanUrlFor } from "@/lib/routes";
import {
  PromoCodesBoard,
  notifyPromoRedeemed,
  type PromoCodeRow,
} from "@/components/PromoCodesBoard";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

/** Homepage launch pass — only while a free code still has remaining uses. */
export function HomeLaunchPass() {
  const [codes, setCodes] = useState<PromoCodeRow[] | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/promo?t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      const data = await res.json();
      const list = Array.isArray(data.codes) ? (data.codes as PromoCodeRow[]) : [];
      const available = list.filter((c) => c.active && c.remaining > 0);
      setCodes(available);
    } catch {
      setCodes([]);
    }
  }, []);

  useEffect(() => {
    void load();
    const onRedeemed = () => void load();
    window.addEventListener("seohub:promo-redeemed", onRedeemed);
    return () => window.removeEventListener("seohub:promo-redeemed", onRedeemed);
  }, [load]);

  useEffect(() => {
    if (codes?.[0] && !code) setCode(codes[0].code);
  }, [codes, code]);

  // Still loading — reserve launch-pass + form height so content doesn't pop in (CLS).
  // If the pool is empty we collapse; that shift is below the fold and rare.
  if (codes === null) {
    return (
      <section className="mt-12 min-h-[14rem] border-t border-transparent pt-10" aria-hidden>
        <div className="h-16 max-w-xl rounded-xl bg-ink/[0.03]" />
        <div className="mt-5 flex max-w-md flex-wrap gap-2">
          <div className="h-11 min-w-[10rem] flex-1 rounded-xl bg-ink/[0.03]" />
          <div className="h-11 w-36 rounded-xl bg-ink/[0.03]" />
        </div>
      </section>
    );
  }
  // Pool empty (or no DB) — remove launch pass entirely. New codes via PROMO_CODES env reappear here.
  if (codes.length === 0) return null;

  async function redeem(e?: FormEvent) {
    e?.preventDefault();
    const value = code.trim();
    if (!value) {
      setError("Enter the launch code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not redeem code");
      saveUnlock(data.sessionId as string);
      trackAnalyticsEvent("promo_redeem", { code: String(data.code || value) });
      trackAnalyticsEvent("unlock", { source: "promo" });
      notifyPromoRedeemed({
        code: String(data.code || value),
        usedCount: Number(data.usedCount),
        maxUses: Number(data.maxUses),
        remaining: Number(data.remaining),
      });
      await new Promise((r) => window.setTimeout(r, 450));
      window.location.href = scanUrlFor("", data.sessionId as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem code");
      setLoading(false);
      void load();
    }
  }

  return (
    <section className="mt-12 border-t border-ink/10 pt-10">
      <PromoCodesBoard />
      <form
        onSubmit={(e) => void redeem(e)}
        className="mt-5 flex max-w-md flex-wrap gap-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={codes[0]?.code || "CODE"}
          autoComplete="off"
          spellCheck={false}
          className="min-w-[10rem] flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2.5 font-mono text-sm uppercase tracking-wide text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60"
        >
          {loading ? "Claiming…" : "Claim free unlock"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      <p className="mt-3 max-w-lg text-xs text-ink-muted">
        One free full-site scan per network. After you claim, paste a URL above and run the scan —
        or scan first, then apply the code on the unlock panel.
      </p>
    </section>
  );
}

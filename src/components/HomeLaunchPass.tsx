"use client";

import { useState, type FormEvent } from "react";
import { saveUnlock } from "@/lib/unlock";
import { scanUrlFor } from "@/lib/routes";
import { PromoCodesBoard, notifyPromoRedeemed } from "@/components/PromoCodesBoard";

/** Homepage launch pass: WELCOME code + live first-100 counter. */
export function HomeLaunchPass() {
  const [code, setCode] = useState("WELCOME");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      notifyPromoRedeemed({
        code: String(data.code || value),
        usedCount: Number(data.usedCount),
        maxUses: Number(data.maxUses),
        remaining: Number(data.remaining),
      });
      // Brief pause so the counter can paint the new claimed total before navigation
      await new Promise((r) => window.setTimeout(r, 450));
      window.location.href = scanUrlFor("", data.sessionId as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem code");
      setLoading(false);
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
          placeholder="WELCOME"
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

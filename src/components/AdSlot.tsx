"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
  label?: string;
}

/**
 * Small ad unit. Renders Google AdSense when NEXT_PUBLIC_ADSENSE_CLIENT is set;
 * otherwise a compact sponsor placeholder so layout stays ready for monetization.
 */
export function AdSlot({
  slot,
  format = "auto",
  className = "",
  label = "Sponsored",
}: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const resolvedSlot = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !resolvedSlot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers / missing script
    }
  }, [client, resolvedSlot]);

  if (client && resolvedSlot) {
    return (
      <aside
        className={`overflow-hidden rounded-xl border border-ink/10 bg-white px-3 py-2 ${className}`}
        aria-label={label}
      >
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </p>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={resolvedSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  return (
    <aside
      className={`rounded-xl border border-dashed border-ink/15 bg-paper/80 px-4 py-3 text-center ${className}`}
      aria-label={label}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-xs text-ink-muted">
        Ad space — set <code className="text-[11px]">NEXT_PUBLIC_ADSENSE_CLIENT</code> to go live.
      </p>
    </aside>
  );
}

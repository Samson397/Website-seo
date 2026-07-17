"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT } from "@/lib/adsense";

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
 * Small ad unit. Renders a Google AdSense display unit when
 * NEXT_PUBLIC_ADSENSE_SLOT (or slot prop) is set; otherwise a compact
 * placeholder. Site-wide Auto ads still load from the root layout script.
 */
export function AdSlot({
  slot,
  format = "auto",
  className = "",
  label = "Sponsored",
}: AdSlotProps) {
  const client = ADSENSE_CLIENT;
  const resolvedSlot = slot || ADSENSE_SLOT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!resolvedSlot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers / missing script
    }
  }, [resolvedSlot]);

  if (resolvedSlot) {
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
        Ad space — set <code className="text-[11px]">NEXT_PUBLIC_ADSENSE_SLOT</code> for a fixed
        unit (Auto ads use the site script).
      </p>
    </aside>
  );
}

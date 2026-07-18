"use client";

import { useEffect, useState } from "react";
import { sanitizePriceLabel } from "@/lib/price-label";
import { FULL_SCAN_PRICE_LABEL, paymentsEnabledClient } from "@/lib/stripe-public";

export function usePaymentsEnabled() {
  const [enabled, setEnabled] = useState(paymentsEnabledClient());
  const [priceLabel, setPriceLabel] = useState(FULL_SCAN_PRICE_LABEL);
  const [blogSpotlights, setBlogSpotlights] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/stripe/status");
        const data = await res.json();
        if (!cancelled && typeof data.enabled === "boolean") {
          setEnabled(Boolean(data.enabled));
          if (data.priceLabel) setPriceLabel(sanitizePriceLabel(String(data.priceLabel)));
          setBlogSpotlights(Boolean(data.blogSpotlights));
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled, priceLabel, blogSpotlights, ready };
}

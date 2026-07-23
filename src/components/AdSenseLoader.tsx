"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { hasAnalyticsConsent } from "@/lib/analytics-client";

const SCRIPT_ATTR = "data-seohub-adsense";

/**
 * Load AdSense Auto ads only after cookie Accept — and well after first paint / LCP.
 * Meta `google-adsense-account` in the root layout still verifies the site.
 * Lab / essential-only visitors never pull Funding Choices or adsbygoogle.js (SI / TTI).
 */
export function AdSenseLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector(`script[${SCRIPT_ATTR}]`)) return;

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;

    const inject = () => {
      if (cancelled || document.querySelector(`script[${SCRIPT_ATTR}]`)) return;
      if (!hasAnalyticsConsent()) return;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
      script.crossOrigin = "anonymous";
      script.setAttribute(SCRIPT_ATTR, "1");
      document.body.appendChild(script);
    };

    const schedule = () => {
      if (!hasAnalyticsConsent()) return;
      // Extra delay past load so Lighthouse TTI / unused-JS settle before ads wake up.
      timeoutId = window.setTimeout(() => {
        const ric = window.requestIdleCallback;
        if (typeof ric === "function") {
          idleId = ric(() => inject(), { timeout: 4000 });
        } else {
          inject();
        }
      }, 5500);
    };

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "accepted") schedule();
    };

    window.addEventListener("seohub-cookie-choice", onConsent);

    if (hasAnalyticsConsent()) {
      if (document.readyState === "complete") {
        schedule();
      } else {
        window.addEventListener("load", schedule, { once: true });
      }
    }

    return () => {
      cancelled = true;
      window.removeEventListener("seohub-cookie-choice", onConsent);
      window.removeEventListener("load", schedule);
      window.clearTimeout(timeoutId);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  return null;
}

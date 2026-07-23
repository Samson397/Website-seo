"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { hasAnalyticsConsent } from "@/lib/analytics-client";

const SCRIPT_ATTR = "data-seohub-adsense";

function loadAdSense() {
  if (typeof window === "undefined") return;
  if (!ADSENSE_CLIENT.startsWith("ca-pub-")) return;
  if (document.querySelector(`script[${SCRIPT_ATTR}]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
  script.crossOrigin = "anonymous";
  script.setAttribute(SCRIPT_ATTR, ADSENSE_CLIENT);
  document.head.appendChild(script);
}

/**
 * Consent-gated AdSense auto ads. Verification meta stays in root layout;
 * the heavy script only loads after cookie Accept (same gate as GA).
 */
export function AdSense() {
  useEffect(() => {
    const tryLoad = () => {
      if (hasAnalyticsConsent()) loadAdSense();
    };

    tryLoad();

    const onConsent = (event: Event) => {
      if ((event as CustomEvent<string>).detail === "accepted") tryLoad();
    };
    window.addEventListener("seohub-cookie-choice", onConsent);
    return () => window.removeEventListener("seohub-cookie-choice", onConsent);
  }, []);

  return null;
}

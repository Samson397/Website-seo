"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { hasAnalyticsConsent } from "@/lib/analytics-client";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

function ensureGtag(measurementId: string) {
  if (typeof window === "undefined") return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-seohub-ga="${measurementId}"]`
  );
  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.seohubGa = measurementId;
  document.head.appendChild(script);
}

function pagePath(pathname: string, searchParams: { toString(): string } | null): string {
  const qs = searchParams?.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Consent-gated GA4. Set NEXT_PUBLIC_GA_MEASUREMENT_ID (G-…).
 * Skips /admin. Loads only after cookie consent = Accept.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef("");

  useEffect(() => {
    if (!MEASUREMENT_ID || !MEASUREMENT_ID.startsWith("G-")) return;
    if (!pathname || pathname.startsWith("/admin")) return;

    const send = () => {
      if (!hasAnalyticsConsent()) return;
      ensureGtag(MEASUREMENT_ID);
      const path = pagePath(pathname, searchParams);
      if (lastPathRef.current === path) return;
      lastPathRef.current = path;
      window.gtag?.("event", "page_view", {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      });
    };

    send();

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "accepted") {
        lastPathRef.current = "";
        send();
      }
    };
    window.addEventListener("seohub-cookie-choice", onConsent);
    return () => window.removeEventListener("seohub-cookie-choice", onConsent);
  }, [pathname, searchParams]);

  return null;
}

export { trackGaEvent } from "@/lib/analytics-client";

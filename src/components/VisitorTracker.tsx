"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "seohub-visitor-id";
const SESSION_KEY = "seohub-session-id";
const CHOICE_KEY = "seohub-cookie-choice";
const HEARTBEAT_MS = 30_000;

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readOrCreate(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing && existing.length >= 8) return existing;
    const id = randomId();
    storage.setItem(key, id);
    return id;
  } catch {
    return randomId();
  }
}

function hasAnalyticsConsent(): boolean {
  try {
    const choice = localStorage.getItem(CHOICE_KEY);
    if (choice === "accepted") return true;
    if (choice === "essential") return false;
    return Boolean(localStorage.getItem("seohub-cookie-accepted"));
  } catch {
    return false;
  }
}

function currentPath(pathname: string, searchParams: { toString(): string } | null): string {
  const qs = searchParams?.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function sendVisit(payload: {
  visitorId: string;
  sessionId: string;
  path: string;
  referrer: string | null;
  heartbeat: boolean;
}) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics/visit", blob)) return;
    } catch {
      // fall through
    }
  }
  void fetch("/api/analytics/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    cache: "no-store",
  }).catch(() => {
    // ignore network errors
  });
}

/**
 * First-party visitor beacon for /admin analytics.
 * Only runs after cookie consent = accepted. Skips /admin routes.
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string>("");
  const idsRef = useRef<{ visitorId: string; sessionId: string } | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const fire = (force = false) => {
      if (!hasAnalyticsConsent()) return;
      const path = currentPath(pathname, searchParams);
      if (!force && lastPathRef.current === path) return;
      lastPathRef.current = path;

      const visitorId = readOrCreate(localStorage, VISITOR_KEY);
      const sessionId = readOrCreate(sessionStorage, SESSION_KEY);
      idsRef.current = { visitorId, sessionId };

      sendVisit({
        visitorId,
        sessionId,
        path,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        heartbeat: false,
      });
    };

    fire(false);

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "accepted") fire(true);
    };
    window.addEventListener("seohub-cookie-choice", onConsent);

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      if (!hasAnalyticsConsent()) return;
      const ids = idsRef.current;
      if (!ids || !lastPathRef.current) return;
      sendVisit({
        visitorId: ids.visitorId,
        sessionId: ids.sessionId,
        path: lastPathRef.current,
        referrer: null,
        heartbeat: true,
      });
    };

    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
      window.removeEventListener("seohub-cookie-choice", onConsent);
    };
  }, [pathname, searchParams]);

  return null;
}

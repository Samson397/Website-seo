/** Browser helpers for first-party analytics (consent-gated). */

const VISITOR_KEY = "seohub-visitor-id";
const SESSION_KEY = "seohub-session-id";
const CHOICE_KEY = "seohub-cookie-choice";

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

export function hasAnalyticsConsent(): boolean {
  try {
    const choice = localStorage.getItem(CHOICE_KEY);
    if (choice === "accepted") return true;
    if (choice === "essential") return false;
    return Boolean(localStorage.getItem("seohub-cookie-accepted"));
  } catch {
    return false;
  }
}

export function getAnalyticsIds(): { visitorId: string; sessionId: string } | null {
  if (typeof window === "undefined") return null;
  if (!hasAnalyticsConsent()) return null;
  try {
    return {
      visitorId: readOrCreate(localStorage, VISITOR_KEY),
      sessionId: readOrCreate(sessionStorage, SESSION_KEY),
    };
  } catch {
    return null;
  }
}

export function trackAnalyticsEvent(
  eventType: "scan" | "unlock" | "promo_redeem" | "checkout_start",
  meta?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  const ids = getAnalyticsIds();
  if (!ids) return;

  const payload = JSON.stringify({
    ...ids,
    eventType,
    path: window.location.pathname + window.location.search,
    meta: meta || null,
  });

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics/event", blob)) return;
    }
  } catch {
    // fall through
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
    cache: "no-store",
  }).catch(() => {
    // ignore
  });
}

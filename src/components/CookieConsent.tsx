"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "seohub-cookie-accepted";
const STORAGE_KEY_LEGACY = "seoscan-cookie-accepted";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY) && !localStorage.getItem(STORAGE_KEY_LEGACY))
        setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      id="seohub-cookie-consent"
      className="cookie-consent-banner fixed bottom-0 left-0 right-0 z-50 border-t border-ink/10 bg-ink p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-lg"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/75">
          We use cookies for analytics and may show small ads. We don&apos;t collect emails. See
          our{" "}
          <Link href="/privacy" className="text-teal-bright hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-lg bg-teal-bright px-4 py-2 text-sm font-semibold text-ink hover:bg-teal"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

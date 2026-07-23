"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "seohub-cookie-accepted";
const STORAGE_KEY_LEGACY = "seoscan-cookie-accepted";
const STORAGE_KEY_CHOICE = "seohub-cookie-choice";

type Choice = "accepted" | "essential";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (
        !localStorage.getItem(STORAGE_KEY) &&
        !localStorage.getItem(STORAGE_KEY_LEGACY) &&
        !localStorage.getItem(STORAGE_KEY_CHOICE)
      ) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      document.documentElement.style.removeProperty("--cookie-banner-space");
      return;
    }
    document.documentElement.style.setProperty("--cookie-banner-space", "7.5rem");
    return () => {
      document.documentElement.style.removeProperty("--cookie-banner-space");
    };
  }, [visible]);

  function choose(choice: Choice) {
    try {
      localStorage.setItem(STORAGE_KEY_CHOICE, choice);
      if (choice === "accepted") localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new CustomEvent("seohub-cookie-choice", { detail: choice }));
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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/75">
          We use cookies for analytics and may show small ads. We don&apos;t collect emails. See
          our{" "}
          <Link href="/privacy" className="text-teal-bright underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-md bg-teal-bright px-4 py-2 text-sm font-semibold text-ink hover:bg-teal"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

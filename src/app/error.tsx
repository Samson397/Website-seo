"use client";

import { useEffect } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Lightweight ops visibility — wire Sentry/etc. via ERROR_WEBHOOK_URL later if needed.
    console.error("[app-error]", error.digest || error.message, error);
    const hook = process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL;
    if (hook) {
      void fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client_error",
          message: error.message,
          digest: error.digest,
          href: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      }).catch(() => {});
    }
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Something went wrong</p>
      <h1 className="font-display mt-3 text-3xl font-semibold text-ink">We hit a snag</h1>
      <p className="mt-3 text-sm text-ink-muted">
        Try again, or head back to the free homepage scan.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href={routes.home}
          className="rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink"
        >
          Home
        </Link>
      </div>
    </main>
  );
}

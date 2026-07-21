"use client";

import Link from "next/link";
import { GoogleConnectPanel } from "@/components/GoogleConnectPanel";
import { routes } from "@/lib/routes";

export function GoogleConnectClient({
  ok,
  error,
  email,
}: {
  ok?: boolean;
  error?: string;
  email?: string;
}) {
  return (
    <div className="space-y-6">
      {ok ? (
        <p className="rounded-xl border border-teal/30 bg-teal-soft/40 px-4 py-3 text-sm text-ink">
          Connected{email ? ` as ${email}` : ""}. Open a scan report or paste a URL below via the
          panel to load Search Console metrics.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <GoogleConnectPanel />

      <p className="text-sm text-ink-muted">
        Prefer crawl-only?{" "}
        <Link href={routes.home} className="text-teal hover:underline">
          Run a free audit
        </Link>{" "}
        with no Google login.
      </p>
    </div>
  );
}

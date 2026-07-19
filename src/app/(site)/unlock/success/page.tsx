"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/brand";
import { saveUnlock } from "@/lib/unlock";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";
import { routes, scanUrlFor } from "@/lib/routes";

export default function UnlockSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pb-16">
          <PageHero title="Confirming payment…" description="One moment." />
        </main>
      }
    >
      <UnlockSuccessInner />
    </Suspense>
  );
}

function UnlockSuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const targetUrl = params.get("url")?.trim() || "";

  useEffect(() => {
    const id = params.get("session_id") || params.get("unlock_session");
    if (!id) {
      setStatus("error");
      setError("Missing checkout session. If you paid, open History and try scanning again.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id }),
        });
        const data = await res.json();
        if (!res.ok || !data.paid) {
          throw new Error(data.error || "Payment could not be verified yet.");
        }
        saveUnlock(id, targetUrl || undefined);
        setSessionId(id);
        setStatus("ok");
        if (targetUrl) {
          window.setTimeout(() => {
            router.replace(scanUrlFor(targetUrl, id));
          }, 900);
        }
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    })();
  }, [params, router, targetUrl]);

  const continueHref =
    status === "ok" && sessionId
      ? targetUrl
        ? scanUrlFor(targetUrl, sessionId)
        : routes.home
      : routes.home;

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Checkout"
        title={
          status === "ok"
            ? "Full SEO unlocked"
            : status === "error"
              ? "Couldn’t confirm payment"
              : "Confirming your payment…"
        }
        description={
          status === "ok"
            ? `Thanks — ${FULL_SCAN_PRICE_LABEL} covers one full-site scan for this report.`
            : status === "error"
              ? error || "Something went wrong."
              : "Verifying with Stripe. Don’t close this tab."
        }
      />
      <div className="mx-auto mt-10 max-w-lg px-4 text-center sm:px-6">
        {status === "ok" ? (
          <div className="space-y-4">
            {targetUrl ? (
              <p className="text-sm text-ink-muted">
                Unlocking your report — then expanding to a full-site crawl…
              </p>
            ) : null}
            <Link
              href={continueHref}
              className="inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-bright"
            >
              {targetUrl ? "Continue to scan" : "Run a full scan"}
            </Link>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-rose-600">{error}</p>
            <p className="text-sm text-ink-muted">
              If you were charged, email{" "}
              <a href={SUPPORT_MAILTO} className="text-brand hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              with your Stripe receipt.
            </p>
            <Link href={routes.history} className="block text-sm font-medium text-brand hover:underline">
              Open History
            </Link>
            <Link href={routes.home} className="block text-sm font-medium text-brand hover:underline">
              Back to scan
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

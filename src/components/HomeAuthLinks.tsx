"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditReport } from "@/lib/types";

export function HomeAuthLinks() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (session) {
    return (
      <Link
        href="/dashboard"
        className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/25"
      >
        My sites
      </Link>
    );
  }

  return (
    <div className="flex gap-2">
      <Link
        href="/login"
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-100 transition hover:text-white"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/25"
      >
        Sign up free
      </Link>
    </div>
  );
}

export function SaveScanBanner({
  url,
  report,
  siteCrawl = false,
}: {
  url: string;
  report: AuditReport;
  siteCrawl?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Want weekly monitoring?</strong>{" "}
        <Link href="/register" className="font-medium underline">
          Create a free account
        </Link>{" "}
        to save this site and track scores over time.
      </div>
    );
  }

  async function saveSite() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, siteCrawl, report }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Could not save site");
      return;
    }

    router.push(`/dashboard/projects/${data.project.id}`);
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>Save this scan to your dashboard for history, exports, and weekly monitoring.</span>
        <button
          type="button"
          onClick={saveSite}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save to dashboard"}
        </button>
      </div>
      {message && <p className="mt-2 text-red-600">{message}</p>}
    </div>
  );
}

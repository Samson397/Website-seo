"use client";

import { useState } from "react";
import type { AuditReport } from "@/lib/types";

export function ShareReportButton({ report }: { report: AuditReport }) {
  const [status, setStatus] = useState<"idle" | "saving" | "copied" | "error">("idle");
  const [link, setLink] = useState<string | null>(
    report.shareId ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${report.shareId}` : null
  );
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setStatus("saving");
    setError(null);
    try {
      let id = report.shareId;
      if (!id) {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create link");
        id = data.id as string;
        report.shareId = id;
      }
      const url = `${window.location.origin}/r/${id}`;
      setLink(url);
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Share failed");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={share}
        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60"
        disabled={status === "saving"}
      >
        {status === "saving"
          ? "Creating link…"
          : status === "copied"
            ? "Link copied"
            : "Copy share link"}
      </button>
      {link && (
        <a href={link} className="max-w-full truncate text-xs text-teal hover:underline">
          {link}
        </a>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

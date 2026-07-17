"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getScanHistory,
  getWatchlist,
  type HistoryEntry,
  type WatchItem,
} from "@/lib/local-history";
import { routes, scanUrlFor } from "@/lib/routes";

interface ScanHistoryPanelProps {
  refreshToken?: number;
  /** Compact teaser for the home page */
  compact?: boolean;
}

/** Compact home teaser — full lists live on /history */
export function ScanHistoryPanel({ refreshToken = 0, compact = true }: ScanHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  useEffect(() => {
    setHistory(getScanHistory());
    setWatchlist(getWatchlist());
  }, [refreshToken]);

  if (history.length === 0 && watchlist.length === 0) return null;

  const previewWatch = watchlist.slice(0, 3);
  const previewHistory = history.slice(0, 3);

  return (
    <section className="mt-10 rounded-2xl border border-ink/10 bg-white px-5 py-6 shadow-sm sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
            Come back weekly
          </p>
          <h2 className="font-display mt-1 text-xl font-semibold text-ink">Your recent activity</h2>
        </div>
        <Link
          href={routes.history}
          className="text-sm font-semibold text-teal hover:underline"
        >
          Open History →
        </Link>
      </div>

      <div className={`mt-5 grid gap-6 ${compact ? "sm:grid-cols-2" : ""}`}>
        {previewWatch.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Watchlist
            </h3>
            <ul className="mt-2 space-y-2">
              {previewWatch.map((item) => (
                <li key={item.hostname} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-ink">{item.hostname}</span>
                  <Link
                    href={scanUrlFor(item.url)}
                    className="shrink-0 text-xs font-semibold text-teal hover:underline"
                  >
                    Scan
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {previewHistory.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Last scans
            </h3>
            <ul className="mt-2 space-y-2">
              {previewHistory.map((item) => (
                <li
                  key={`${item.hostname}-${item.scannedAt}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-ink">
                    <span className="font-medium">{item.hostname}</span>
                    <span className="text-ink-muted"> · {item.overall}</span>
                  </span>
                  <Link
                    href={scanUrlFor(item.url)}
                    className="shrink-0 text-xs font-semibold text-teal hover:underline"
                  >
                    Re-scan
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

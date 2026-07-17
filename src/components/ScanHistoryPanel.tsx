"use client";

import { useEffect, useState } from "react";
import {
  getScanHistory,
  getWatchlist,
  toggleWatch,
  type HistoryEntry,
  type WatchItem,
} from "@/lib/local-history";

interface ScanHistoryPanelProps {
  onRescan: (url: string) => void;
  refreshToken?: number;
}

export function ScanHistoryPanel({ onRescan, refreshToken = 0 }: ScanHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  useEffect(() => {
    setHistory(getScanHistory());
    setWatchlist(getWatchlist());
  }, [refreshToken]);

  if (history.length === 0 && watchlist.length === 0) return null;

  return (
    <section className="mt-10 grid gap-8 lg:grid-cols-2">
      {watchlist.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Watchlist</p>
          <h2 className="font-display mt-1 text-xl font-semibold text-ink">Sites you track</h2>
          <ul className="mt-4 divide-y divide-ink/5 border-t border-ink/10">
            {watchlist.map((item) => (
              <li key={item.hostname} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.hostname}</p>
                  <p className="text-xs text-ink-muted">
                    {item.lastOverall != null ? `Last score ${item.lastOverall}` : "Not rescanned yet"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onRescan(item.url)}
                    className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-bright"
                  >
                    Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatchlist(toggleWatch(item.url))}
                    className="rounded-lg bg-mist px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">On this device</p>
          <h2 className="font-display mt-1 text-xl font-semibold text-ink">Recent scans</h2>
          <ul className="mt-4 divide-y divide-ink/5 border-t border-ink/10">
            {history.slice(0, 8).map((item) => (
              <li key={`${item.hostname}-${item.scannedAt}`} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.hostname}</p>
                  <p className="text-xs text-ink-muted">
                    Score {item.overall}
                    {item.pagesScanned ? ` · ${item.pagesScanned} pages` : ""} ·{" "}
                    {new Date(item.scannedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRescan(item.url)}
                  className="shrink-0 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal/40 hover:text-teal"
                >
                  Re-scan
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">Saved in your browser only — no login.</p>
        </div>
      )}
    </section>
  );
}

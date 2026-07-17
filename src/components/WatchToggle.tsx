"use client";

import { useEffect, useState } from "react";
import { isWatched, toggleWatch } from "@/lib/local-history";
import type { AuditReport } from "@/lib/types";

export function WatchToggle({ report }: { report: AuditReport }) {
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setWatched(isWatched(report.url));
  }, [report.url]);

  return (
    <button
      type="button"
      onClick={() => {
        toggleWatch(report.url, report);
        setWatched(isWatched(report.url));
      }}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        watched
          ? "bg-teal-soft text-teal ring-1 ring-teal/30"
          : "bg-mist text-ink hover:bg-teal-soft hover:text-teal"
      }`}
    >
      {watched ? "Watching on this device" : "Watch this site"}
    </button>
  );
}

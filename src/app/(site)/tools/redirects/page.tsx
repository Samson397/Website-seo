"use client";

import { ToolShell } from "@/components/tools/ToolShell";

type RedirectResult = {
  hops: number;
  finalUrl: string | null;
  finalStatus: number | null;
  https: boolean;
  chain: Array<{ url: string; status: number; location: string | null }>;
};

export default function RedirectsToolPage() {
  return (
    <main className="min-h-screen pb-8">
      <ToolShell
        eyebrow="Free tool"
        title="Redirect chain checker"
        description="Follow every hop from your URL to the final destination — catch loops, mixed HTTP, and soft 404s."
        endpoint="/api/tools/redirects"
      >
        {(raw) => {
          const data = raw as RedirectResult;
          return (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Hops" value={String(data.hops)} />
                <Stat label="Final status" value={String(data.finalStatus ?? "—")} />
                <Stat label="HTTPS" value={data.https ? "Yes" : "No"} warn={!data.https} />
              </div>
              <ol className="divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
                {data.chain.map((hop, i) => (
                  <li key={`${hop.url}-${i}`} className="px-4 py-3">
                    <p className="text-xs font-semibold text-teal">Hop {i + 1}</p>
                    <p className="mt-1 break-all font-mono text-xs text-ink">{hop.url}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Status {hop.status}
                      {hop.location ? ` → ${hop.location}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
              {data.finalUrl ? (
                <p className="text-sm text-ink-muted">
                  Lands on <span className="font-mono text-ink">{data.finalUrl}</span>
                </p>
              ) : null}
            </div>
          );
        }}
      </ToolShell>
    </main>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${warn ? "text-amber-600" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

"use client";

import { ToolShell } from "@/components/tools/ToolShell";

type BrokenResult = {
  pageUrl: string;
  checked: number;
  brokenCount: number;
  okCount: number;
  broken: Array<{ url: string; status: number; ok: boolean }>;
};

export default function BrokenLinksToolPage() {
  return (
    <main className="min-h-screen pb-8">
      <ToolShell
        eyebrow="Free tool"
        title="Broken link checker"
        description="Fetch a page and probe up to 40 outbound links for 4xx/5xx failures."
        endpoint="/api/tools/broken-links"
      >
        {(raw) => {
          const data = raw as BrokenResult;
          return (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Checked" value={String(data.checked)} />
                <Stat label="OK" value={String(data.okCount)} />
                <Stat label="Broken" value={String(data.brokenCount)} warn={data.brokenCount > 0} />
              </div>
              {data.brokenCount === 0 ? (
                <div className="rounded-2xl border border-teal/20 bg-teal-soft/40 px-4 py-6 text-sm text-teal">
                  No broken links in the sample we checked.
                </div>
              ) : (
                <ul className="divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
                  {data.broken.map((link) => (
                    <li key={link.url} className="px-4 py-3">
                      <p className="break-all font-mono text-xs text-ink">{link.url}</p>
                      <p className="mt-1 text-sm font-semibold text-rose-700">
                        {link.status === 0 ? "Failed to fetch" : `HTTP ${link.status}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
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
      <p className={`mt-1 font-display text-2xl font-semibold ${warn ? "text-rose-600" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ToolShell } from "@/components/tools/ToolShell";
import { routes } from "@/lib/routes";

type KeywordResult = {
  url: string;
  seed: string;
  onPage: Array<{ phrase: string; source: string; count?: number }>;
  suggestions: Array<{ phrase: string; source: string }>;
  dataForSeo: Array<{ keyword: string; volume?: number; difficulty?: number }>;
  hasDataForSeo: boolean;
};

export default function KeywordsToolPage() {
  return (
    <main className="min-h-screen pb-8">
      <ToolShell
        eyebrow="Keyword research"
        title="Find keywords from any page"
        description="Extract phrases from titles, headings, and copy — plus Google suggestions. Optional DataForSEO volume when configured."
        endpoint="/api/tools/keywords"
      >
        {(raw) => {
          const data = raw as KeywordResult;
          return (
            <div className="space-y-6">
              <p className="text-sm text-ink-muted">
                Seed: <strong className="text-ink">{data.seed}</strong>
                {data.hasDataForSeo ? " · DataForSEO volumes loaded" : ""}
              </p>

              {data.dataForSeo.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink">Search volume ideas</h2>
                  <ul className="mt-3 divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
                    {data.dataForSeo.map((k) => (
                      <li key={k.keyword} className="flex justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-ink">{k.keyword}</span>
                        <span className="shrink-0 text-ink-muted">
                          {k.volume != null ? `${k.volume}/mo` : "—"}
                          {k.difficulty != null ? ` · diff ${k.difficulty}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.suggestions.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink">Google suggestions</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.suggestions.map((s) => (
                      <span
                        key={s.phrase}
                        className="rounded-lg bg-teal-soft px-2.5 py-1 text-xs font-medium text-teal"
                      >
                        {s.phrase}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="font-display text-lg font-semibold text-ink">On-page phrases</h2>
                <ul className="mt-3 divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
                  {data.onPage.slice(0, 20).map((k) => (
                    <li key={k.phrase} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                      <span className="text-ink">{k.phrase}</span>
                      <span className="text-xs text-ink-muted">{k.source}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <p className="text-sm text-ink-muted">
                <Link href={routes.tracker} className="text-teal hover:underline">
                  Track keywords on this device
                </Link>{" "}
                or{" "}
                <Link href={routes.rankChecker} className="text-teal hover:underline">
                  run a rank check
                </Link>
                .
              </p>
            </div>
          );
        }}
      </ToolShell>
    </main>
  );
}

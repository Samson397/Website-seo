"use client";

import Link from "next/link";
import { ToolShell } from "@/components/tools/ToolShell";
import { RELATED_BY_TOOL } from "@/lib/related-tools";
import { routes } from "@/lib/routes";
import { difficultyLabel } from "@/lib/keyword-intelligence";

type KeywordResult = {
  url: string;
  seed: string;
  onPage: Array<{ phrase: string; source: string; count?: number }>;
  suggestions: Array<{ phrase: string; source: string }>;
  dataForSeo: Array<{
    keyword: string;
    volume?: number;
    difficulty?: number;
    cpc?: number;
    competition?: number;
    intent: string;
    recommendation: string;
    cluster: string;
  }>;
  clusters?: Array<{
    cluster: string;
    keywords: Array<{ keyword: string; volume?: number; intent: string }>;
  }>;
  example?: {
    keyword: string;
    intent: string;
    difficulty?: number;
    recommendation: string;
  } | null;
  hasDataForSeo: boolean;
};

export default function KeywordsToolPage() {
  return (
    <main className="min-h-screen pb-8">
      <ToolShell
        eyebrow="Keyword research"
        title="Find keywords from any page"
        description="Volume, difficulty, CPC, search intent, clusters, and a concrete page recommendation — crawl-first, no Google login."
        endpoint="/api/tools/keywords"
        relatedTools={[...RELATED_BY_TOOL.keywords]}
      >
        {(raw) => {
          const data = raw as KeywordResult;
          return (
            <div className="space-y-6">
              <p className="text-sm text-ink-muted">
                Seed: <strong className="text-ink">{data.seed}</strong>
                {data.hasDataForSeo ? " · DataForSEO volumes loaded" : " · Intent from phrases (add DataForSEO for volume/CPC)"}
              </p>

              {data.example ? (
                <section className="rounded-2xl border border-teal/25 bg-teal-soft/30 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                    Recommendation
                  </p>
                  <p className="mt-2 font-display text-lg font-semibold text-ink">
                    “{data.example.keyword}”
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-ink-muted">Intent</dt>
                      <dd className="font-medium capitalize text-ink">{data.example.intent}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Difficulty</dt>
                      <dd className="font-medium text-ink">
                        {difficultyLabel(data.example.difficulty)}
                        {data.example.difficulty != null ? ` (${data.example.difficulty})` : ""}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-ink-muted">Next step</dt>
                      <dd className="font-medium text-ink">{data.example.recommendation}</dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              {data.dataForSeo.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink">Keyword ideas</h2>
                  <ul className="mt-3 divide-y divide-ink/5 rounded-2xl border border-ink/10 bg-white">
                    {data.dataForSeo.map((k) => (
                      <li key={k.keyword} className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-medium text-ink">{k.keyword}</span>
                          <span className="shrink-0 text-ink-muted">
                            {k.volume != null ? `${k.volume}/mo` : "—"}
                            {k.difficulty != null ? ` · diff ${k.difficulty}` : ""}
                            {k.cpc != null ? ` · CPC $${Number(k.cpc).toFixed(2)}` : ""}
                          </span>
                        </div>
                        <p className="mt-1 text-xs capitalize text-ink-muted">
                          {k.intent} · {k.recommendation}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.clusters && data.clusters.length > 0 ? (
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink">Clusters</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {data.clusters.slice(0, 8).map((c) => (
                      <div
                        key={c.cluster}
                        className="rounded-2xl border border-ink/10 bg-white px-4 py-3"
                      >
                        <p className="text-sm font-semibold capitalize text-ink">{c.cluster}</p>
                        <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                          {c.keywords.slice(0, 5).map((k) => (
                            <li key={k.keyword}>
                              {k.keyword}
                              {k.volume != null ? ` · ${k.volume}/mo` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

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
                Next:{" "}
                <Link href={routes.contentOptimizer} className="font-medium text-teal hover:underline">
                  Content optimizer
                </Link>{" "}
                or{" "}
                <Link href={routes.rankChecker} className="font-medium text-teal hover:underline">
                  Rank checker
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

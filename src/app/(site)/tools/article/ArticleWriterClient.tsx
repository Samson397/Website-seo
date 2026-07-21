"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";

type Draft = {
  keyword: string;
  intent: string;
  recommendation: string;
  seoTitle: string;
  metaDescription: string;
  outline: string[];
  article: string;
  faqs: Array<{ question: string; answer: string }>;
  schemaJsonLd: string;
  internalLinkIdeas: string[];
  source: "deepseek" | "template";
};

export default function ArticleWriterClient() {
  const [keyword, setKeyword] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/tools/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, siteUrl: siteUrl || undefined, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDraft(data.draft as Draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">AI Content Studio</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          AI article writer
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Generate an SEO title, outline, article, FAQs, schema, and internal link ideas from a
          keyword. Uses DeepSeek when configured; otherwise a solid template draft.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <label className="block text-sm">
            <span className="font-medium text-ink">Keyword</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
              placeholder="best dentist Edinburgh"
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Site URL (optional)</span>
            <input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Audience, location, offer…"
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
          >
            {loading ? "Writing…" : "Generate draft"}
          </button>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </form>

        {draft ? (
          <div className="mt-10 space-y-8">
            <section className="rounded-2xl border border-teal/25 bg-teal-soft/30 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-teal">Intent · {draft.intent}</p>
              <p className="mt-1 text-sm text-ink">{draft.recommendation}</p>
              <p className="mt-2 text-xs text-ink-muted">Source: {draft.source}</p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold">SEO title</h2>
              <p className="mt-2 text-sm text-ink">{draft.seoTitle}</p>
              <h3 className="mt-4 text-sm font-semibold text-ink">Meta description</h3>
              <p className="mt-1 text-sm text-ink-muted">{draft.metaDescription}</p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold">Outline</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
                {draft.outline.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold">Article</h2>
              <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-ink/10 bg-white p-4 text-sm text-ink">
                {draft.article}
              </pre>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold">FAQs</h2>
              <ul className="mt-3 space-y-3">
                {draft.faqs.map((f) => (
                  <li key={f.question} className="rounded-xl border border-ink/10 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{f.question}</p>
                    <p className="mt-1 text-sm text-ink-muted">{f.answer}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold">Schema JSON-LD</h2>
              <pre className="mt-3 overflow-auto rounded-2xl border border-ink/10 bg-ink p-4 text-xs text-white">
                {draft.schemaJsonLd}
              </pre>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold">Internal link ideas</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {draft.internalLinkIdeas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </section>

            <p className="text-sm text-ink-muted">
              Next:{" "}
              <Link href={routes.contentOptimizer} className="text-teal hover:underline">
                Content optimizer
              </Link>{" "}
              or{" "}
              <Link href={routes.keywords} className="text-teal hover:underline">
                Keyword research
              </Link>
              .
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

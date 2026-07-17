"use client";

import { useState } from "react";

const MAX_COMPETITORS = 10;
const DEFAULT_ROWS = 3;

interface CompetitorUrlInputProps {
  onSubmit: (urls: string[]) => void;
  loading: boolean;
  progress?: { current: number; total: number; url: string } | null;
}

export function CompetitorUrlInput({ onSubmit, loading, progress }: CompetitorUrlInputProps) {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [values, setValues] = useState<string[]>(() => Array(DEFAULT_ROWS).fill(""));

  function updateRow(index: number, value: string) {
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addRow() {
    if (rows >= MAX_COMPETITORS) return;
    setRows((r) => r + 1);
    setValues((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    if (rows <= 1) return;
    setRows((r) => r - 1);
    setValues((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const urls = values.map((v) => v.trim()).filter(Boolean);
    if (urls.length > 0) onSubmit(urls);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-muted">
        Enter up to {MAX_COMPETITORS} competitor websites to compare side by side. Each site is
        audited independently — your site is not included unless you add it.
      </p>

      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex gap-2">
            <label htmlFor={`competitor-url-${index}`} className="sr-only">
              Competitor {index + 1}
            </label>
            <input
              id={`competitor-url-${index}`}
              type="text"
              value={values[index] ?? ""}
              onChange={(e) => updateRow(index, e.target.value)}
              placeholder={`competitor${index + 1}.com`}
              disabled={loading}
              className="flex-1 rounded-xl border border-ink/10 bg-paper px-4 py-3 text-ink placeholder:text-ink-muted/50 focus:border-teal focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:opacity-60"
            />
            {rows > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={loading}
                className="rounded-xl border border-ink/10 px-3 text-ink-muted transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-40"
                aria-label={`Remove competitor ${index + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {rows < MAX_COMPETITORS && (
        <button
          type="button"
          onClick={addRow}
          disabled={loading}
          className="text-sm font-medium text-teal hover:text-teal-bright disabled:opacity-40"
        >
          + Add another site
        </button>
      )}

      {progress && (
        <div className="rounded-xl border border-teal/20 bg-teal-soft/50 px-4 py-3 text-sm text-teal">
          Auditing {progress.current} of {progress.total}:{" "}
          <span className="font-medium text-ink">{progress.url}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || values.every((v) => !v.trim())}
        className="w-full rounded-xl bg-ink px-8 py-3.5 font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Auditing competitors…" : "Audit competitors"}
      </button>
    </form>
  );
}

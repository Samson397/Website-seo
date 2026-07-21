"use client";

import { useEffect, useRef, useState } from "react";
import { getUnlock } from "@/lib/unlock";
import {
  aiFixPlanPlainText,
  copyText,
  downloadTextFile,
} from "@/lib/ai-fix-plan-export";
import type { AiFixPlan } from "@/lib/ai-fix-plan-types";
import type { AuditReport } from "@/lib/types";

interface AiFixPlanPanelProps {
  report: AuditReport;
  /** Auto-generate when DeepSeek is available (default true). */
  auto?: boolean;
  onPlan?: (plan: AiFixPlan | null) => void;
}

function hostnameSlug(url: string) {
  try {
    return new URL(url).hostname.replace(/\./g, "-");
  } catch {
    return "site";
  }
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          const ok = await copyText(text);
          if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }
        })();
      }}
      className="rounded-lg border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:border-teal/40 hover:bg-teal-soft"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function AiFixPlanPanel({ report, auto = true, onPlan }: AiFixPlanPanelProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<AiFixPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/ai/status");
        const data = await res.json();
        if (!cancelled) setEnabled(Boolean(data.enabled));
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPlan(null);
    onPlan?.(null);
    setError(null);
    startedFor.current = null;
    // intentionally only reset when the report identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.url, report.scannedAt]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const sessionId = getUnlock()?.sessionId;
      const res = await fetch("/api/ai/fix-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate fix plan");
      const next = data.plan as AiFixPlan;
      setPlan(next);
      onPlan?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI fix plan failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!auto || !enabled) return;
    const key = `${report.url}|${report.scannedAt}`;
    if (startedFor.current === key) return;
    startedFor.current = key;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, enabled, report.url, report.scannedAt]);

  if (enabled === false) return null;
  if (enabled === null) {
    return (
      <section className="animate-rise rounded-2xl border border-ink/10 bg-white px-5 py-5">
        <p className="text-sm text-ink-muted">Preparing AI brief…</p>
      </section>
    );
  }

  return (
    <section className="animate-rise rounded-2xl border border-teal/25 bg-gradient-to-br from-white to-teal-soft/30 px-5 py-6 sm:px-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">AI brief</p>
      <h3 className="font-display mt-1 text-xl font-semibold text-ink sm:text-2xl">
        Priority fix plan
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Auto-written from this scan: executive summary, ranked fixes, title/meta rewrites, clearer
        issue actions, and a draft <code className="text-xs">llms.txt</code>.
      </p>

      {loading && !plan ? (
        <p className="mt-5 text-sm font-medium text-ink/70">Writing your plan…</p>
      ) : null}

      {!plan && !loading ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => void generate()}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            Generate AI fix plan
          </button>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </div>
      ) : null}

      {plan ? (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <CopyButton label="Copy brief" text={aiFixPlanPlainText(plan)} />
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  aiFixPlanPlainText(plan),
                  `seohub-ai-brief-${hostnameSlug(report.url)}.txt`
                )
              }
              className="rounded-lg border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:border-teal/40 hover:bg-teal-soft"
            >
              Download brief
            </button>
            {plan.llmsTxtDraft ? (
              <>
                <CopyButton label="Copy llms.txt" text={plan.llmsTxtDraft} />
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(plan.llmsTxtDraft, `llms-${hostnameSlug(report.url)}.txt`)
                  }
                  className="rounded-lg border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:border-teal/40 hover:bg-teal-soft"
                >
                  Download llms.txt
                </button>
              </>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Executive summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">{plan.executiveSummary}</p>
            {plan.projectedScoreNote ? (
              <p className="mt-2 text-sm font-medium text-teal">{plan.projectedScoreNote}</p>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Do these first
            </p>
            <ol className="mt-3 space-y-3">
              {plan.priorityFixes.map((fix, i) => (
                <li
                  key={`${fix.title}-${i}`}
                  className="rounded-xl border border-ink/10 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-ink">{fix.title}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        fix.impact === "high"
                          ? "bg-rose-100 text-rose-700"
                          : fix.impact === "low"
                            ? "bg-mist text-ink-muted"
                            : "bg-amber-soft text-amber-900"
                      }`}
                    >
                      {fix.impact}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{fix.why}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{fix.action}</p>
                </li>
              ))}
            </ol>
          </div>

          {plan.metaRewrites.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Title & meta rewrites
              </p>
              <ul className="mt-3 space-y-3">
                {plan.metaRewrites.map((meta) => (
                  <li
                    key={`${meta.path}-${meta.suggestedTitle}`}
                    className="rounded-xl border border-ink/10 bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-xs text-teal">{meta.path}</p>
                      <CopyButton
                        label="Copy title + meta"
                        text={`Title: ${meta.suggestedTitle}\nMeta: ${meta.suggestedDescription}`}
                      />
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">Title</p>
                    <p className="text-sm text-ink-muted line-through">{meta.currentTitle || "—"}</p>
                    <p className="text-sm font-semibold text-ink">{meta.suggestedTitle}</p>
                    <p className="mt-2 text-xs text-ink-muted">Meta description</p>
                    <p className="text-sm text-ink-muted line-through">
                      {meta.currentDescription || "—"}
                    </p>
                    <p className="text-sm text-ink">{meta.suggestedDescription}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {plan.nextSteps.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Next steps
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {plan.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {plan.llmsTxtDraft ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Draft llms.txt
              </p>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-xs leading-relaxed text-ink">
                {plan.llmsTxtDraft}
              </pre>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="text-sm font-medium text-teal hover:underline disabled:opacity-60"
          >
            {loading ? "Regenerating…" : "Regenerate plan"}
          </button>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

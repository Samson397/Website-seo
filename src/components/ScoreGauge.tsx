import { formatTen, toTen } from "@/lib/score-display";

interface ScoreGaugeProps {
  label: string;
  /** Internal 0–100 score */
  score: number;
  skipped?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-teal";
  if (score >= 75) return "text-amber-700";
  if (score >= 50) return "text-orange-600";
  return "text-rose-600";
}

function ringColor(score: number): string {
  if (score >= 90) return "stroke-teal";
  if (score >= 75) return "stroke-amber-500";
  if (score >= 50) return "stroke-orange-500";
  return "stroke-rose-500";
}

export function ScoreGauge({ label, score, skipped }: ScoreGaugeProps) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const ten = formatTen(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
        <svg className="h-20 w-20 -rotate-90 sm:h-24 sm:w-24" viewBox="0 0 80 80" aria-hidden>
          <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          {!skipped && (
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              className={ringColor(score)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          )}
        </svg>
        <span
          className={`absolute inset-0 flex flex-col items-center justify-center leading-none ${
            skipped ? "text-slate-400" : scoreColor(score)
          }`}
        >
          {skipped ? (
            <span className="text-xl font-bold">—</span>
          ) : (
            <>
              <span className="font-display text-xl font-semibold tabular-nums sm:text-2xl">
                {ten}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                /10
              </span>
            </>
          )}
        </span>
      </div>
      <span className="mt-2 text-center text-xs font-medium text-ink-muted sm:text-sm">{label}</span>
      {!skipped ? (
        <span className="sr-only">
          {label} score {toTen(score)} out of 10
        </span>
      ) : null}
    </div>
  );
}

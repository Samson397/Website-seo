interface ScoreGaugeProps {
  label: string;
  score: number;
  skipped?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

function ringColor(score: number): string {
  if (score >= 90) return "stroke-green-500";
  if (score >= 75) return "stroke-yellow-500";
  if (score >= 50) return "stroke-orange-500";
  return "stroke-red-500";
}

export function ScoreGauge({ label, score, skipped }: ScoreGaugeProps) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="6"
          />
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
          className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${skipped ? "text-slate-400" : scoreColor(score)}`}
        >
          {skipped ? "—" : score}
        </span>
      </div>
      <span className="mt-2 text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

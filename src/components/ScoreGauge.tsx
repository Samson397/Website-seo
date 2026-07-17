"use client";

import type { CSSProperties } from "react";

interface ScoreGaugeProps {
  label: string;
  score: number;
  skipped?: boolean;
  size?: "sm" | "md" | "lg";
}

function scoreTone(score: number): { text: string; stroke: string } {
  if (score >= 90) return { text: "text-accent", stroke: "#16a34a" };
  if (score >= 75) return { text: "text-brand-bright", stroke: "#14b8a6" };
  if (score >= 50) return { text: "text-amber", stroke: "#d97706" };
  return { text: "text-coral", stroke: "#e11d48" };
}

const SIZES = {
  sm: { box: "h-20 w-20", text: "text-lg", r: 30, stroke: 5 },
  md: { box: "h-28 w-28", text: "text-2xl", r: 38, stroke: 7 },
  lg: { box: "h-36 w-36", text: "text-4xl", r: 48, stroke: 8 },
} as const;

export function ScoreGauge({ label, score, skipped, size = "md" }: ScoreGaugeProps) {
  const dim = SIZES[size];
  const view = 100;
  const cx = view / 2;
  const cy = view / 2;
  const circumference = 2 * Math.PI * dim.r;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const tone = scoreTone(score);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${dim.box}`}>
        <svg className={`${dim.box} -rotate-90`} viewBox={`0 0 ${view} ${view}`}>
          <defs>
            <linearGradient id={`gauge-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={tone.stroke} />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={dim.r}
            fill="none"
            stroke="#dbe7ee"
            strokeWidth={dim.stroke}
          />
          {!skipped && (
            <circle
              cx={cx}
              cy={cy}
              r={dim.r}
              fill="none"
              stroke={`url(#gauge-${label})`}
              strokeWidth={dim.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="gauge-ring"
              style={
                {
                  ["--gauge-circumference" as string]: circumference,
                } as CSSProperties
              }
            />
          )}
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-display font-semibold tracking-tight ${dim.text} ${
            skipped ? "text-ink-muted" : tone.text
          }`}
        >
          {skipped ? "—" : score}
        </span>
      </div>
      <span className="mt-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
    </div>
  );
}

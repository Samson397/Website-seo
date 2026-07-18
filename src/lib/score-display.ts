/** Convert internal 0–100 scores to a 0–10 scale for display. */
export function toTen(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.round((Math.max(0, Math.min(100, score)) / 10) * 10) / 10;
}

export function formatTen(score: number): string {
  const t = toTen(score);
  return Number.isInteger(t) ? String(t) : t.toFixed(1);
}

export function formatTenLabel(score: number): string {
  return `${formatTen(score)}/10`;
}

export function overallFromScores(scores: {
  seo: number;
  performance: number;
  accessibility: number;
  security: number;
  ai?: number;
}): number {
  const parts = [
    scores.seo,
    scores.performance,
    scores.accessibility,
    scores.security,
    scores.ai,
  ].filter((n): n is number => typeof n === "number");
  if (parts.length === 0) return 0;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

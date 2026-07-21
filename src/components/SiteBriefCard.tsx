import type { SiteBrief } from "@/lib/types";

interface SiteBriefCardProps {
  brief: SiteBrief;
  compact?: boolean;
}

export function SiteBriefCard({ brief, compact = false }: SiteBriefCardProps) {
  const confidencePct = Math.round((brief.confidence || 0) * 100);

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-ink/10 bg-mist/40 px-4 py-3"
          : "rounded-3xl border border-ink/10 bg-white px-6 py-5 shadow-sm sm:px-8"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
        What this site is
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-semibold text-ink sm:text-xl">{brief.niche}</h3>
        <span className="text-xs text-ink-muted">{confidencePct}% confidence</span>
      </div>
      <p className={`mt-2 text-sm text-ink-muted ${compact ? "line-clamp-3" : ""}`}>
        {brief.summary}
      </p>
    </section>
  );
}

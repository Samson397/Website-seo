"use client";

interface SerpPreviewProps {
  title: string;
  description: string;
  url: string;
}

export function SerpPreview({ title, description, url }: SerpPreviewProps) {
  const displayTitle =
    title.length > 60 ? `${title.substring(0, 57)}...` : title;
  const displayDescription =
    description.length > 160
      ? `${description.substring(0, 157)}...`
      : description;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Google Search Preview
      </h3>
      <div className="rounded-lg bg-white p-4">
        <div className="mb-1 break-all text-sm text-slate-600">{url}</div>
        <div className="text-xl text-blue-800 hover:underline">{displayTitle}</div>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">
          {displayDescription}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Approximate preview — actual appearance may vary in search results.
      </p>
    </div>
  );
}

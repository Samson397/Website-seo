"use client";

interface UrlInputProps {
  onSubmit: (url: string, siteCrawl: boolean) => void;
  loading: boolean;
}

export function UrlInput({ onSubmit, loading }: UrlInputProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("url") as HTMLInputElement;
    const crawlInput = form.elements.namedItem("siteCrawl") as HTMLInputElement;
    const url = input.value.trim();
    if (url) onSubmit(url, crawlInput.checked);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="url"
          placeholder="https://example.com"
          required
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="siteCrawl"
          defaultChecked={false}
          disabled={loading}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Full site scan — crawl up to 10 pages (sitemap + links) for duplicate titles &amp; descriptions
      </label>
    </form>
  );
}

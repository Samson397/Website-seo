"use client";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export function UrlInput({ onSubmit, loading }: UrlInputProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("url") as HTMLInputElement;
    const url = input.value.trim();
    if (url) onSubmit(url);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="audit-url" className="sr-only">
          Website URL
        </label>
        <input
          id="audit-url"
          type="text"
          name="url"
          placeholder="yourwebsite.com"
          required
          disabled={loading}
          autoComplete="url"
          inputMode="url"
          className="flex-1 rounded-xl border border-ink/10 bg-white/90 px-4 py-3.5 text-ink shadow-inner placeholder:text-ink-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal px-8 py-3.5 font-semibold text-white shadow-glow transition hover:bg-teal-bright focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Scanning site…" : "Scan site"}
        </button>
      </div>
      <p className="text-center text-xs text-ink-muted sm:text-left">
        Free preview scores the homepage. Unlock for a full-site crawl and detailed fixes.
      </p>
    </form>
  );
}

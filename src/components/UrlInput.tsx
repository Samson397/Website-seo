"use client";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  variant?: "default" | "hero";
}

export function UrlInput({ onSubmit, loading, variant = "default" }: UrlInputProps) {
  const isHero = variant === "hero";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("url") as HTMLInputElement;
    const url = input.value.trim();
    if (url) onSubmit(url);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
          className={
            isHero
              ? "flex-1 rounded-lg border border-white/15 bg-white/[0.07] px-4 py-3.5 text-white placeholder:text-white/35 outline-none transition focus:border-brand-bright focus:bg-white/[0.1] disabled:opacity-60"
              : "flex-1 rounded-lg border border-ink/10 bg-white px-4 py-3.5 text-ink placeholder:text-ink-muted/60 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
          }
        />
        <button
          type="submit"
          disabled={loading}
          className={
            isHero
              ? "w-full rounded-lg bg-brand-bright px-8 py-3.5 font-semibold text-ink transition hover:bg-white disabled:opacity-60 sm:w-auto"
              : "w-full rounded-lg bg-ink px-8 py-3.5 font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60 sm:w-auto"
          }
        >
          {loading ? "Scanning…" : "Scan site"}
        </button>
      </div>
      <p className={`text-xs sm:text-left ${isHero ? "text-white/45" : "text-ink-muted"}`}>
        Free preview scores the homepage. Unlock for a full-site crawl and detailed fixes.
      </p>
    </form>
  );
}

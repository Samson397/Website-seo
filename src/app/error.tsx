"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">SEOScan</p>
      <h1 className="font-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-muted">
        {error.message || "An unexpected error occurred. Try again in a moment."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        Try again
      </button>
    </main>
  );
}

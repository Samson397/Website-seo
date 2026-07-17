"use client";

import { useMemo, useState } from "react";

export default function MetaPreviewPage() {
  const [title, setTitle] = useState("Acme Co — Modern tools for growing teams");
  const [description, setDescription] = useState(
    "Ship faster with Acme. SEO-friendly pages, clear messaging, and a site that looks great when shared."
  );
  const [url, setUrl] = useState("https://acme.example/pricing");

  const displayHost = useMemo(() => {
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      return u.hostname + u.pathname.replace(/\/$/, "");
    } catch {
      return url;
    }
  }, [url]);

  return (
    <main className="min-h-screen pb-16">
      <section className="border-b border-ink/10 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Free tool</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
            Meta &amp; SERP preview
          </h1>
          <p className="mt-3 text-ink-muted">
            Tune your title and description before you ship. Nothing is stored.
          </p>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Field label="Title" hint={`${title.length} chars · aim 50–60`}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </Field>
          <Field label="Meta description" hint={`${description.length} chars · aim 120–160`}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </Field>
          <Field label="URL">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </Field>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Google-style result
            </p>
            <p className="mt-3 text-sm text-emerald-800">{displayHost}</p>
            <p className="mt-1 text-xl text-[#1a0dab] hover:underline">{title || "Page title"}</p>
            <p className="mt-1 text-sm text-[#4d5156]">
              {description || "Meta description appears here."}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-ink to-teal text-sm text-white/70">
              Social image placeholder
            </div>
            <div className="border-t border-ink/5 px-4 py-3">
              <p className="truncate text-xs uppercase tracking-wide text-ink-muted">{displayHost}</p>
              <p className="mt-1 font-semibold text-ink">{title || "Open Graph title"}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                {description || "Open Graph description"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm font-medium text-ink">
        {label}
        {hint && <span className="text-xs font-normal text-ink-muted">{hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

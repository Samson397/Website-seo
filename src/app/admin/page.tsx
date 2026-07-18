"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Session = {
  configured: boolean;
  authenticated: boolean;
  database: boolean;
  promoDb: boolean;
  blogDb: boolean;
};

type PromoRow = {
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  remaining: number;
  active: boolean;
};

type BlogRow = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: string;
  tags?: string[];
  body: string[];
  published: boolean;
  source: "db" | "seed";
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<"promos" | "blog">("promos");
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newMax, setNewMax] = useState("50");
  const [newLabel, setNewLabel] = useState("Promo unlock");

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("SEO");
  const [tags, setTags] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/admin/session", { cache: "no-store" });
    const data = (await res.json()) as Session;
    setSession(data);
    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/admin/promos", { cache: "no-store" }),
        fetch("/api/admin/blog", { cache: "no-store" }),
      ]);
      if (pRes.status === 401 || bRes.status === 401) {
        setSession((s) => (s ? { ...s, authenticated: false } : s));
        return;
      }
      const pData = await pRes.json();
      const bData = await bRes.json();
      if (!pRes.ok) throw new Error(pData.error || "Could not load promos");
      if (!bRes.ok) throw new Error(bData.error || "Could not load blog");
      setPromos(Array.isArray(pData.codes) ? pData.codes : []);
      setPosts(Array.isArray(bData.posts) ? bData.posts : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const s = await refreshSession();
      if (s.authenticated) void loadData();
    })();
  }, [refreshSession, loadData]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setPassword("");
      await refreshSession();
      await loadData();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setPromos([]);
    setPosts([]);
    await refreshSession();
  }

  async function createPromo(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          maxUses: Number(newMax),
          label: newLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create code");
      setNewCode("");
      setFormMsg(`Created ${data.code.code}`);
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function togglePromo(code: string, active: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function editPost(post: BlogRow) {
    setSlug(post.slug);
    setTitle(post.title);
    setSummary(post.summary);
    setPublishedAt(post.publishedAt);
    setCategory(post.category);
    setTags((post.tags || []).join(", "));
    setBodyText(post.body.join("\n\n"));
    setTab("blog");
    setFormMsg(
      post.source === "seed"
        ? "Seed post — saving creates a DB copy you can edit/unpublish."
        : null
    );
  }

  async function savePost(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          summary,
          publishedAt,
          category,
          tags,
          bodyText,
          published: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save post");
      setFormMsg(`Saved /blog/${data.post.slug}`);
      setSlug("");
      setTitle("");
      setSummary("");
      setBodyText("");
      setTags("");
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function setPublished(slugValue: string, published: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugValue, published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(slugValue: string) {
    if (!window.confirm(`Delete DB post “${slugValue}”? Seed posts in code are unaffected.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog?slug=${encodeURIComponent(slugValue)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sm text-ink-muted">Loading…</main>
    );
  }

  if (!session.configured) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink">Admin not configured</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Set <code className="font-mono text-ink">ADMIN_SECRET</code> in Vercel (at least 8
          characters). You can reuse <code className="font-mono text-ink">INSIGHTS_SECRET</code>{" "}
          instead. Redeploy, then open <code className="font-mono text-ink">/admin</code> again.
        </p>
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Enter your admin secret. No public signup — owner only.
        </p>
        <form onSubmit={(e) => void login(e)} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ADMIN_SECRET"
            autoComplete="current-password"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={loggingIn || !password}
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60"
          >
            {loggingIn ? "Checking…" : "Enter admin"}
          </button>
        </form>
        {loginError ? <p className="mt-3 text-sm text-rose-600">{loginError}</p> : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Promo codes + blog posts · DB{" "}
            {session.database ? "connected" : "missing (set DATABASE_URL)"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-xl border border-ink/15 px-3 py-2 text-xs font-semibold text-ink hover:border-brand/40"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-ink/10 pb-2">
        <button
          type="button"
          onClick={() => setTab("promos")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            tab === "promos" ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          Promo codes
        </button>
        <button
          type="button"
          onClick={() => setTab("blog")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            tab === "blog" ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          Blog
        </button>
      </div>

      {loadError ? <p className="mt-4 text-sm text-rose-600">{loadError}</p> : null}
      {formMsg ? <p className="mt-4 text-sm text-brand">{formMsg}</p> : null}

      {tab === "promos" ? (
        <section className="mt-8 space-y-8">
          <form onSubmit={(e) => void createPromo(e)} className="space-y-3 rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Create code</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="SPRING26"
                className="rounded-xl border border-ink/15 px-3 py-2 font-mono text-sm uppercase"
              />
              <input
                value={newMax}
                onChange={(e) => setNewMax(e.target.value)}
                placeholder="Max uses"
                type="number"
                min={1}
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label"
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !session.promoDb}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Create promo
            </button>
            {!session.promoDb ? (
              <p className="text-xs text-ink-muted">Needs DATABASE_URL (Neon).</p>
            ) : null}
          </form>

          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">All codes</h2>
            {promos.length === 0 ? (
              <p className="text-sm text-ink-muted">No codes yet.</p>
            ) : (
              promos.map((c) => (
                <div
                  key={c.code}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3"
                >
                  <div>
                    <p className="font-mono font-semibold text-ink">{c.code}</p>
                    <p className="text-xs text-ink-muted">
                      {c.usedCount}/{c.maxUses} used · {c.remaining} left ·{" "}
                      {c.active ? "active" : "inactive"} · {c.label}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void togglePromo(c.code, !c.active)}
                    className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:border-brand/40"
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      ) : (
        <section className="mt-8 space-y-8">
          <form onSubmit={(e) => void savePost(e)} className="space-y-3 rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Write / update post</h2>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="slug-kebab-case"
              className="w-full rounded-xl border border-ink/15 px-3 py-2 font-mono text-sm"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
            />
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary (meta description)"
              rows={2}
              className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tags, comma, separated"
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder={"Body paragraphs.\n\nSeparate paragraphs with a blank line."}
              rows={10}
              className="w-full rounded-xl border border-ink/15 px-3 py-2 font-body text-sm leading-relaxed"
            />
            <button
              type="submit"
              disabled={busy || !session.blogDb}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Publish to /blog
            </button>
            {!session.blogDb ? (
              <p className="text-xs text-ink-muted">Needs DATABASE_URL (Neon) to save posts.</p>
            ) : (
              <p className="text-xs text-ink-muted">
                Goes live after save (no redeploy). Blank line = new paragraph.
              </p>
            )}
          </form>

          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">Posts</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-ink-muted">No posts.</p>
            ) : (
              posts.map((p) => (
                <div
                  key={`${p.source}-${p.slug}`}
                  className="flex flex-wrap items-start justify-between gap-3 border-t border-ink/10 pt-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-ink-muted">
                      /blog/{p.slug} · {p.publishedAt} · {p.source}
                      {p.source === "db" ? (p.published ? " · live" : " · draft") : " · in code"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => editPost(p)}
                      className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    {p.source === "db" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void setPublished(p.slug, !p.published)}
                          className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold"
                        >
                          {p.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removePost(p.slug)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}

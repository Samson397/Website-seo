"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Tab = "overview" | "visitors" | "ga" | "scans" | "payments" | "reports" | "promos" | "blog";

type Session = {
  configured: boolean;
  authenticated: boolean;
  database: boolean;
  promoDb: boolean;
  blogDb: boolean;
  analyticsDb?: boolean;
  googleOAuth?: boolean;
  gaMeasurement?: boolean;
  gaDataApi?: boolean;
};

type NamedCount = { name: string; count: number };

type VisitorsSummary = {
  configured: boolean;
  onlineNow: number;
  onlineWindowMinutes: number;
  totals: {
    viewsToday: number;
    views7d: number;
    views30d: number;
    uniqueToday: number;
    unique7d: number;
    unique30d: number;
    new7d: number;
    returning7d: number;
  };
  funnel: {
    visitors: number;
    scans: number;
    unlocks: number;
    visitToScanPct: number;
    scanToUnlockPct: number;
    visitToUnlockPct: number;
  };
  countries: NamedCount[];
  pages: NamedCount[];
  referrers: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  utmSources: NamedCount[];
  utmCampaigns: NamedCount[];
  hourly: { hour: string; count: number }[];
  online: {
    visitorId: string;
    lastPath: string | null;
    country: string | null;
    city: string | null;
    device: string | null;
    lastSeenAt: string;
  }[];
  recent: {
    path: string;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    referrer: string | null;
    utmSource: string | null;
    createdAt: string;
  }[];
  settings: {
    enabled: boolean;
    blockBots: boolean;
    blockedCountries: string[];
    blockedIpHashes: string[];
    blockedPathPrefixes: string[];
    digestEnabled: boolean;
    digestEmail: string;
  };
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

type Overview = {
  health: { key: string; label: string; ok: boolean }[];
  storeBackend: string;
  stats: { source: string; sampleSize: number; avgOverall: number; avgSeo: number };
  counts: {
    activePromoCodes: number;
    promoRemaining: number;
    recentReports: number;
    recentPaidCheckouts: number;
  };
  recentPaid: {
    id: string;
    amountTotal: number | null;
    currency: string | null;
    url: string | null;
    createdAt: string;
    paymentStatus: string | null;
  }[];
  recentReports: {
    id: string;
    hostname: string;
    overall: number | null;
    access: string;
    createdAt: string;
  }[];
};

type GaSummary = {
  configured: boolean;
  source: "service_account" | "oauth" | null;
  propertyId: string | null;
  measurementIdConfigured?: boolean;
  propertyIdConfigured?: boolean;
  dataApiReady?: boolean;
  hasOauthRefresh?: boolean;
  totals: {
    activeUsers7d: number;
    sessions7d: number;
    screenPageViews7d: number;
    activeUsers30d: number;
    sessions30d: number;
    screenPageViews30d: number;
  };
  topPages: { path: string; views: number }[];
  topCountries: { name: string; users: number }[];
  daily: { date: string; users: number; views: number }[];
  error?: string;
};

type ScanEvent = {
  hostname: string;
  overall: number;
  seo: number;
  failCount: number;
  pagesScanned: number;
  scannedAt: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "visitors", label: "Visitors" },
  { id: "ga", label: "GA4" },
  { id: "scans", label: "Scans" },
  { id: "payments", label: "Payments" },
  { id: "reports", label: "Reports" },
  { id: "promos", label: "Promos" },
  { id: "blog", label: "Blog" },
];

function money(cents: number | null, currency: string | null) {
  if (cents == null) return "—";
  const cur = (currency || "usd").toUpperCase();
  return `${(cents / 100).toFixed(2)} ${cur}`;
}

function when(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [scanStats, setScanStats] = useState<{
    sampleSize: number;
    avgOverall: number;
    avgFailCount: number;
    source: string;
  } | null>(null);
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [stripeSessions, setStripeSessions] = useState<
    {
      id: string;
      paymentStatus: string | null;
      amountTotal: number | null;
      currency: string | null;
      url: string | null;
      customerEmail: string | null;
      createdAt: string;
      consumed: boolean;
    }[]
  >([]);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripeError, setStripeError] = useState<string | undefined>();
  const [promoUnlocks, setPromoUnlocks] = useState<
    { id: string; code: string; clientIp: string | null; consumed: boolean; createdAt: string }[]
  >([]);
  const [reports, setReports] = useState<
    {
      id: string;
      url: string;
      hostname: string;
      overall: number | null;
      access: string;
      createdAt: string;
    }[]
  >([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [visitors, setVisitors] = useState<VisitorsSummary | null>(null);
  const [ga, setGa] = useState<GaSummary | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    enabled: true,
    blockBots: true,
    blockedCountries: "",
    blockedIpHashes: "",
    blockedPathPrefixes: "",
    digestEnabled: false,
    digestEmail: "",
  });

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

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/admin/session", { cache: "no-store" });
    const data = (await res.json()) as Session;
    setSession(data);
    return data;
  }, []);

  const loadTab = useCallback(async (active: Tab) => {
    setLoadError(null);
    setFormMsg(null);
    try {
      if (active === "overview") {
        const res = await fetch("/api/admin/overview", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Overview failed");
        setOverview(data as Overview);
        return;
      }
      if (active === "visitors") {
        const res = await fetch("/api/admin/visitors", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Visitors failed");
        const summary = data as VisitorsSummary;
        setVisitors(summary);
        if (summary.settings) {
          setSettingsForm({
            enabled: summary.settings.enabled,
            blockBots: summary.settings.blockBots,
            blockedCountries: summary.settings.blockedCountries.join(", "),
            blockedIpHashes: summary.settings.blockedIpHashes.join("\n"),
            blockedPathPrefixes: summary.settings.blockedPathPrefixes.join("\n"),
            digestEnabled: summary.settings.digestEnabled,
            digestEmail: summary.settings.digestEmail,
          });
        }
        return;
      }
      if (active === "ga") {
        const res = await fetch("/api/admin/ga", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "GA4 failed");
        setGa(data as GaSummary);
        return;
      }
      if (active === "scans") {
        const res = await fetch("/api/admin/scans", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Scans failed");
        setScanStats({
          sampleSize: Number(data.stats?.sampleSize || 0),
          avgOverall: Number(data.stats?.avgOverall || 0),
          avgFailCount: Number(data.stats?.avgFailCount || 0),
          source: String(data.stats?.source || ""),
        });
        setEvents(Array.isArray(data.events) ? data.events : []);
        return;
      }
      if (active === "payments") {
        const res = await fetch("/api/admin/payments", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Payments failed");
        setStripeEnabled(Boolean(data.stripe?.enabled));
        setStripeError(data.stripe?.error);
        setStripeSessions(Array.isArray(data.stripe?.sessions) ? data.stripe.sessions : []);
        setPromoUnlocks(Array.isArray(data.promoUnlocks) ? data.promoUnlocks : []);
        return;
      }
      if (active === "reports") {
        const res = await fetch("/api/admin/reports", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reports failed");
        setReports(Array.isArray(data.reports) ? data.reports : []);
        return;
      }
      if (active === "promos") {
        const res = await fetch("/api/admin/promos", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Promos failed");
        setPromos(Array.isArray(data.codes) ? data.codes : []);
        return;
      }
      if (active === "blog") {
        const res = await fetch("/api/admin/blog", { cache: "no-store" });
        if (res.status === 401) {
          setSession((s) => (s ? { ...s, authenticated: false } : s));
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Blog failed");
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    try {
      const params = new URLSearchParams(window.location.search);
      const googleError = params.get("google_error");
      if (googleError) {
        setLoginError(googleError);
        window.history.replaceState({}, "", "/admin");
      } else if (params.get("google") === "1") {
        window.history.replaceState({}, "", "/admin");
      }
    } catch {
      // ignore
    }
  }, [refreshSession]);

  useEffect(() => {
    if (session?.authenticated) void loadTab(tab);
  }, [tab, session?.authenticated, loadTab]);

  // Keep “online now” fresh while the Visitors tab is open
  useEffect(() => {
    if (!session?.authenticated || tab !== "visitors") return;
    const id = window.setInterval(() => {
      void loadTab("visitors");
    }, 30_000);
    return () => window.clearInterval(id);
  }, [session?.authenticated, tab, loadTab]);

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
      setTab("overview");
      await loadTab("overview");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setOverview(null);
    await refreshSession();
  }

  async function saveVisitorSettings(e: FormEvent) {
    e.preventDefault();
    setSettingsBusy(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/visitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save settings");
      setFormMsg("Visitor settings saved.");
      await loadTab("visitors");
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function createPromo(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode, maxUses: Number(newMax), label: newLabel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create code");
      setNewCode("");
      setFormMsg(`Created ${data.code.code}`);
      await loadTab("promos");
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
      await loadTab("promos");
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReport(id: string) {
    if (!window.confirm(`Delete report /r/${id}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reports?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await loadTab("reports");
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Delete failed");
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
      await loadTab("blog");
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
      await loadTab("blog");
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(slugValue: string) {
    if (!window.confirm(`Delete DB post “${slugValue}”?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog?slug=${encodeURIComponent(slugValue)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await loadTab("blog");
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return <main className="mx-auto max-w-lg px-4 py-16 text-sm text-ink-muted">Loading…</main>;
  }

  if (!session.configured) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink">Admin not configured</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Set <code className="font-mono text-ink">ADMIN_SECRET</code> in Vercel (8+ chars),
          redeploy, then open <code className="font-mono text-ink">/admin</code>.
        </p>
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">Owner access only — no public signup.</p>
        {session.googleOAuth ? (
          <a
            href="/api/auth/google"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand/40"
          >
            Continue with Google
          </a>
        ) : null}
        {session.googleOAuth ? (
          <p className="mt-4 text-center text-xs uppercase tracking-wide text-ink-muted">or</p>
        ) : null}
        <form onSubmit={(e) => void login(e)} className="mt-4 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ADMIN_SECRET"
            autoComplete="current-password"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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
            Health, visitors, scans, payments, reports, promos · DB{" "}
            {session.database ? "connected" : "missing"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-xl border border-ink/15 px-3 py-2 text-xs font-semibold hover:border-brand/40"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-ink/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              tab === t.id ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadError ? <p className="mt-4 text-sm text-rose-600">{loadError}</p> : null}
      {formMsg ? <p className="mt-4 text-sm text-brand">{formMsg}</p> : null}

      {tab === "overview" && overview ? (
        <section className="mt-8 space-y-8">
          <div>
            <h2 className="font-display text-lg font-semibold">Health</h2>
            <ul className="mt-3 space-y-2">
              {overview.health.map((h) => (
                <li key={h.key} className="flex items-center justify-between text-sm">
                  <span>{h.label}</span>
                  <span className={h.ok ? "font-semibold text-teal" : "font-semibold text-rose-600"}>
                    {h.ok ? "OK" : "Off"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-muted">Store: {overview.storeBackend}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Scans sampled</p>
              <p className="mt-1 font-display text-2xl font-semibold">{overview.stats.sampleSize}</p>
              <p className="text-xs text-ink-muted">
                avg {overview.stats.avgOverall} overall · {overview.stats.source}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Promo pool</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {overview.counts.promoRemaining}
              </p>
              <p className="text-xs text-ink-muted">
                {overview.counts.activePromoCodes} active codes
              </p>
            </div>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Recent paid unlocks</h2>
            {overview.recentPaid.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">No recent paid checkouts.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {overview.recentPaid.map((p) => (
                  <li key={p.id} className="border-t border-ink/10 pt-2 text-sm">
                    <span className="font-medium">{money(p.amountTotal, p.currency)}</span>
                    <span className="text-ink-muted"> · {when(p.createdAt)}</span>
                    {p.url ? <p className="truncate text-xs text-ink-muted">{p.url}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "visitors" ? (
        <section className="mt-8 space-y-8">
          {!visitors ? (
            <p className="text-sm text-ink-muted">Loading visitor analytics…</p>
          ) : !visitors.configured ? (
            <p className="text-sm text-ink-muted">
              Connect Neon (<code className="font-mono text-ink">DATABASE_URL</code>) to store
              first-party visitor analytics. Tracking only runs after cookie consent = Accept.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Online now</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-teal">
                    {visitors.onlineNow}
                  </p>
                  <p className="text-xs text-ink-muted">
                    active in last {visitors.onlineWindowMinutes} min · auto-refresh
                  </p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Views today</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {visitors.totals.viewsToday}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {visitors.totals.uniqueToday} unique visitors
                  </p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Last 7 days</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {visitors.totals.views7d}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {visitors.totals.unique7d} unique · {visitors.totals.new7d} new /{" "}
                    {visitors.totals.returning7d} returning
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold">Conversion funnel (30d)</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-ink/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Visitors</p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {visitors.funnel.visitors}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Scans</p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {visitors.funnel.scans}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {visitors.funnel.visitToScanPct}% of visitors
                    </p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Unlocks</p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {visitors.funnel.unlocks}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {visitors.funnel.scanToUnlockPct}% of scans ·{" "}
                      {visitors.funnel.visitToUnlockPct}% of visitors
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="font-display text-lg font-semibold">Countries</h2>
                  {visitors.countries.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">No country data yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {visitors.countries.map((c) => (
                        <li
                          key={c.name}
                          className="flex items-center justify-between border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-ink-muted">{c.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Top pages</h2>
                  {visitors.pages.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">No page views yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {visitors.pages.map((p) => (
                        <li
                          key={p.name}
                          className="flex items-center justify-between gap-3 border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="truncate font-medium">{p.name}</span>
                          <span className="shrink-0 text-ink-muted">{p.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Referrers</h2>
                  {visitors.referrers.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">No referrers yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {visitors.referrers.map((r) => (
                        <li
                          key={r.name}
                          className="flex items-center justify-between gap-3 border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="truncate font-medium">{r.name}</span>
                          <span className="shrink-0 text-ink-muted">{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Devices & browsers</h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <ul className="space-y-2">
                      {visitors.devices.map((d) => (
                        <li
                          key={d.name}
                          className="flex items-center justify-between border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="capitalize">{d.name}</span>
                          <span className="text-ink-muted">{d.count}</span>
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2">
                      {visitors.browsers.map((b) => (
                        <li
                          key={b.name}
                          className="flex items-center justify-between border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="capitalize">{b.name}</span>
                          <span className="text-ink-muted">{b.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">UTM sources</h2>
                  {visitors.utmSources.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">
                      No UTM traffic yet. Use <code className="font-mono">?utm_source=</code> links.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {visitors.utmSources.map((u) => (
                        <li
                          key={u.name}
                          className="flex items-center justify-between border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="text-ink-muted">{u.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">UTM campaigns</h2>
                  {visitors.utmCampaigns.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">No campaign tags yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {visitors.utmCampaigns.map((u) => (
                        <li
                          key={u.name}
                          className="flex items-center justify-between border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="text-ink-muted">{u.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold">Last 24 hours</h2>
                {visitors.hourly.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">No hourly traffic yet.</p>
                ) : (
                  <ul className="mt-3 space-y-1">
                    {visitors.hourly.map((h) => {
                      const max = Math.max(...visitors.hourly.map((x) => x.count), 1);
                      const pct = Math.max(4, Math.round((h.count / max) * 100));
                      return (
                        <li key={h.hour} className="flex items-center gap-3 text-xs">
                          <span className="w-28 shrink-0 font-mono text-ink-muted">
                            {when(h.hour).replace(/:\d{2}\s/, " ")}
                          </span>
                          <span className="h-2 flex-1 rounded-full bg-mist">
                            <span
                              className="block h-2 rounded-full bg-brand/70"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="w-8 text-right text-ink-muted">{h.count}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="font-display text-lg font-semibold">Online visitors</h2>
                  {visitors.online.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">Nobody online right now.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {visitors.online.map((o) => (
                        <li key={o.visitorId} className="border-t border-ink/10 pt-2 text-sm">
                          <p className="font-medium">{o.lastPath || "—"}</p>
                          <p className="text-xs text-ink-muted">
                            {[o.city, o.country].filter(Boolean).join(", ") || "Unknown location"}
                            {o.device ? ` · ${o.device}` : ""} · {when(o.lastSeenAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Recent visits</h2>
                  {visitors.recent.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">No visits recorded yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {visitors.recent.map((r, i) => (
                        <li
                          key={`${r.createdAt}-${r.path}-${i}`}
                          className="border-t border-ink/10 pt-2 text-sm"
                        >
                          <p className="truncate font-medium">{r.path}</p>
                          <p className="text-xs text-ink-muted">
                            {[r.city, r.country].filter(Boolean).join(", ") || "Unknown"}
                            {r.device ? ` · ${r.device}` : ""}
                            {r.browser ? ` · ${r.browser}` : ""}
                            {r.utmSource ? ` · utm:${r.utmSource}` : ""} · {when(r.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold">Spam / bot controls</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Tracking only runs after cookie Accept. Filters apply to page views and funnel
                  events.
                </p>
                <form onSubmit={(e) => void saveVisitorSettings(e)} className="mt-4 space-y-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settingsForm.enabled}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, enabled: e.target.checked }))
                      }
                    />
                    Analytics enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settingsForm.blockBots}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, blockBots: e.target.checked }))
                      }
                    />
                    Block bots / crawlers
                  </label>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Blocked countries (ISO codes)
                    </label>
                    <input
                      value={settingsForm.blockedCountries}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, blockedCountries: e.target.value }))
                      }
                      placeholder="CN, RU, ..."
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Blocked IP hashes (one per line)
                    </label>
                    <textarea
                      value={settingsForm.blockedIpHashes}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, blockedIpHashes: e.target.value }))
                      }
                      rows={3}
                      placeholder="Paste hashes from logs if needed"
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 font-mono text-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Blocked path prefixes
                    </label>
                    <textarea
                      value={settingsForm.blockedPathPrefixes}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, blockedPathPrefixes: e.target.value }))
                      }
                      rows={2}
                      placeholder={"/wp-admin\n/.env"}
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 font-mono text-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div className="border-t border-ink/10 pt-4">
                    <h3 className="font-display text-base font-semibold">Weekly traffic email</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      Mondays via Resend cron (<code className="font-mono">/api/cron/weekly-traffic</code>
                      ). Needs <code className="font-mono">RESEND_*</code> +{" "}
                      <code className="font-mono">CRON_SECRET</code>.
                    </p>
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settingsForm.digestEnabled}
                        onChange={(e) =>
                          setSettingsForm((s) => ({ ...s, digestEnabled: e.target.checked }))
                        }
                      />
                      Send weekly digest
                    </label>
                    <input
                      type="email"
                      value={settingsForm.digestEmail}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, digestEmail: e.target.value }))
                      }
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={settingsBusy}
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-bright disabled:opacity-60"
                  >
                    {settingsBusy ? "Saving…" : "Save controls"}
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "ga" ? (
        <section className="mt-8 space-y-8">
          {!ga ? (
            <p className="text-sm text-ink-muted">Loading Google Analytics…</p>
          ) : !ga.configured ? (
            <div className="space-y-3 text-sm text-ink-muted">
              <p>
                GA4 reports need a property id plus either a service account or a Google admin
                sign-in with Analytics access. See <code className="font-mono text-ink">docs/google-setup.md</code>.
              </p>
              {ga.error ? <p className="text-rose-600">{ga.error}</p> : null}
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Measurement ID (site tag):{" "}
                  {ga.measurementIdConfigured ? "set" : "missing NEXT_PUBLIC_GA_MEASUREMENT_ID"}
                </li>
                <li>
                  Property ID: {ga.propertyIdConfigured || ga.propertyId ? "set" : "missing GA4_PROPERTY_ID"}
                </li>
                <li>
                  OAuth refresh cookie: {ga.hasOauthRefresh ? "present" : "sign in with Google once"}
                </li>
              </ul>
              {session.googleOAuth ? (
                <a
                  href="/api/auth/google"
                  className="inline-flex rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand/40"
                >
                  Re-authorize Google (Analytics)
                </a>
              ) : null}
            </div>
          ) : (
            <>
              <p className="text-xs text-ink-muted">
                Source: {ga.source === "service_account" ? "service account" : "Google OAuth"} ·
                property {ga.propertyId}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Users (7d)</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {ga.totals.activeUsers7d}
                  </p>
                  <p className="text-xs text-ink-muted">{ga.totals.sessions7d} sessions</p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Views (7d)</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {ga.totals.screenPageViews7d}
                  </p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Users (30d)</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {ga.totals.activeUsers30d}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {ga.totals.screenPageViews30d} views · {ga.totals.sessions30d} sessions
                  </p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="font-display text-lg font-semibold">Top pages (30d)</h2>
                  {ga.topPages.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">No page data yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {ga.topPages.map((p) => (
                        <li
                          key={p.path}
                          className="flex items-center justify-between gap-3 border-t border-ink/10 pt-2 text-sm"
                        >
                          <span className="truncate font-mono text-xs">{p.path}</span>
                          <span className="shrink-0 text-ink-muted">{p.views}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Top countries (30d)</h2>
                  {ga.topCountries.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">No country data yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {ga.topCountries.map((c) => (
                        <li
                          key={c.name}
                          className="flex items-center justify-between border-t border-ink/10 pt-2 text-sm"
                        >
                          <span>{c.name}</span>
                          <span className="text-ink-muted">{c.users}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold">Daily (14d)</h2>
                {ga.daily.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">No daily series yet.</p>
                ) : (
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    {ga.daily.map((d) => (
                      <li
                        key={d.date}
                        className="flex items-center justify-between border-t border-ink/10 pt-2 text-sm"
                      >
                        <span className="font-mono text-xs">{d.date}</span>
                        <span className="text-ink-muted">
                          {d.users} users · {d.views} views
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "scans" ? (
        <section className="mt-8 space-y-6">
          {scanStats ? (
            <p className="text-sm text-ink-muted">
              {scanStats.sampleSize} samples · avg overall {scanStats.avgOverall} · avg fails{" "}
              {scanStats.avgFailCount} · {scanStats.source}
            </p>
          ) : null}
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-ink-muted">No scan events yet.</p>
            ) : (
              events.map((e, i) => (
                <div key={`${e.hostname}-${e.scannedAt}-${i}`} className="border-t border-ink/10 pt-2 text-sm">
                  <p className="font-medium text-ink">{e.hostname}</p>
                  <p className="text-xs text-ink-muted">
                    overall {e.overall} · seo {e.seo} · fails {e.failCount} · {e.pagesScanned}{" "}
                    pages · {when(e.scannedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {tab === "payments" ? (
        <section className="mt-8 space-y-8">
          <div>
            <h2 className="font-display text-lg font-semibold">Stripe checkouts</h2>
            {!stripeEnabled ? (
              <p className="mt-2 text-sm text-ink-muted">Stripe not configured.</p>
            ) : null}
            {stripeError ? <p className="mt-2 text-sm text-rose-600">{stripeError}</p> : null}
            <ul className="mt-3 space-y-2">
              {stripeSessions.map((s) => (
                <li key={s.id} className="border-t border-ink/10 pt-2 text-sm">
                  <p className="font-medium">
                    {money(s.amountTotal, s.currency)} · {s.paymentStatus}
                    {s.consumed ? " · consumed" : ""}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {when(s.createdAt)}
                    {s.customerEmail ? ` · ${s.customerEmail}` : ""}
                  </p>
                  {s.url ? <p className="truncate text-xs text-ink-muted">{s.url}</p> : null}
                  <p className="font-mono text-[10px] text-ink-muted/70">{s.id}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Promo unlocks</h2>
            <ul className="mt-3 space-y-2">
              {promoUnlocks.length === 0 ? (
                <p className="text-sm text-ink-muted">No promo unlocks yet.</p>
              ) : (
                promoUnlocks.map((u) => (
                  <li key={u.id} className="border-t border-ink/10 pt-2 text-sm">
                    <span className="font-mono font-semibold">{u.code}</span>
                    <span className="text-ink-muted">
                      {" "}
                      · {u.consumed ? "used" : "unused"} · {when(u.createdAt)}
                    </span>
                    {u.clientIp ? (
                      <p className="text-xs text-ink-muted">IP {u.clientIp}</p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "reports" ? (
        <section className="mt-8 space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-ink-muted">No stored reports.</p>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 border-t border-ink/10 pt-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{r.hostname}</p>
                  <p className="text-xs text-ink-muted">
                    /r/{r.id} · {r.access} · score {r.overall ?? "—"} · {when(r.createdAt)}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{r.url}</p>
                </div>
                <div className="flex gap-2">
                  {r.access === "shared" ? (
                    <a
                      href={`/r/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold"
                    >
                      Open
                    </a>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteReport(r.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}

      {tab === "promos" ? (
        <section className="mt-8 space-y-8">
          <form
            onSubmit={(e) => void createPromo(e)}
            className="space-y-3 rounded-2xl border border-ink/10 bg-white p-5"
          >
            <h2 className="font-display text-lg font-semibold">Create code</h2>
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
          </form>
          <div className="space-y-3">
            {promos.map((c) => (
              <div
                key={c.code}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3"
              >
                <div>
                  <p className="font-mono font-semibold">{c.code}</p>
                  <p className="text-xs text-ink-muted">
                    {c.usedCount}/{c.maxUses} · {c.remaining} left ·{" "}
                    {c.active ? "active" : "inactive"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void togglePromo(c.code, !c.active)}
                  className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold"
                >
                  {c.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "blog" ? (
        <section className="mt-8 space-y-8">
          <form
            onSubmit={(e) => void savePost(e)}
            className="space-y-3 rounded-2xl border border-ink/10 bg-white p-5"
          >
            <h2 className="font-display text-lg font-semibold">Write / update post</h2>
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
              placeholder="Summary"
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
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tags"
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder={"Paragraphs.\n\nBlank line between them."}
              rows={8}
              className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !session.blogDb}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Publish
            </button>
          </form>
          <div className="space-y-3">
            {posts.map((p) => (
              <div
                key={`${p.source}-${p.slug}`}
                className="flex flex-wrap items-start justify-between gap-3 border-t border-ink/10 pt-3"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-ink-muted">
                    /blog/{p.slug} · {p.source}
                    {p.source === "db" ? (p.published ? " · live" : " · draft") : ""}
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
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

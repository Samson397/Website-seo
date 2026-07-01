"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUrlDisplay } from "@/lib/url-display";
import { UptimeBadge } from "@/components/dashboard/UptimePanel";

interface ProjectSummary {
  id: string;
  name: string;
  url: string;
  monitorEnabled: boolean;
  uptimeEnabled: boolean;
  lastUptimeStatus: string | null;
  lastScanAt: string | null;
  scans: {
    seoScore: number;
    performanceScore: number;
    accessibilityScore: number;
    securityScore: number;
    criticalCount: number;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [limit, setLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadProjects() {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to load projects");
      return;
    }

    setProjects(data.projects);
    setLimit(data.limit);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newUrl }),
    });

    const data = await res.json();
    setAdding(false);

    if (!res.ok) {
      setError(data.error || "Failed to add site");
      return;
    }

    setNewUrl("");
    setShowAdd(false);
    await loadProjects();
  }

  function overallScore(scan: ProjectSummary["scans"][0]) {
    return Math.round(
      (scan.seoScore + scan.performanceScore + scan.accessibilityScore + scan.securityScore) / 4
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My sites</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track SEO scores, uptime, and SSL — weekly SEO scans + checks every 15 minutes
            </p>
          </div>
          {projects.length < limit && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add site
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showAdd && (
          <form
            onSubmit={handleAdd}
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label htmlFor="site-url" className="block text-sm font-medium text-slate-700">
              Website URL
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="site-url"
                type="text"
                required
                placeholder="yourwebsite.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              />
              <button
                type="submit"
                disabled={adding}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {adding ? "Adding…" : "Save site"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="mt-10 text-center text-slate-500">Loading your sites…</p>
        ) : projects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-600">No sites yet. Add your first website to start monitoring.</p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add your first site
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {projects.map((project) => {
              const last = project.scans[0];
              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
                        {project.uptimeEnabled && (
                          <UptimeBadge status={project.lastUptimeStatus} />
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{formatUrlDisplay(project.url)}</p>
                    </div>
                    {last ? (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{overallScore(last)}</p>
                        <p className="text-xs text-slate-500">
                          {last.criticalCount} critical ·{" "}
                          {new Date(last.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-amber-600">No scans yet</span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    SEO: {project.monitorEnabled ? "Weekly" : "Off"} · Uptime:{" "}
                    {project.uptimeEnabled ? "Every 15 min" : "Off"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Free plan · {projects.length}/{limit} sites
        </p>
    </main>
  );
}

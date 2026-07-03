"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ScoreTrend } from "@/components/dashboard/ScoreTrend";
import { UptimePanel } from "@/components/dashboard/UptimePanel";
import { formatUrlDisplay } from "@/lib/url-display";
import { SiteChecklistPanel } from "@/components/SiteChecklistPanel";
import type { AuditReport } from "@/lib/types";

interface ProjectDetail {
  id: string;
  name: string;
  url: string;
  siteCrawl: boolean;
  monitorEnabled: boolean;
  uptimeEnabled: boolean;
  lastScanAt: string | null;
  lastUptimeStatus: string | null;
  lastUptimeAt: string | null;
  lastUptimeMs: number | null;
  lastUptimeHttpStatus: number | null;
  lastSslExpiryDays: number | null;
  scans: {
    id: string;
    createdAt: string;
    trigger: string;
    seoScore: number;
    performanceScore: number;
    accessibilityScore: number;
    securityScore: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
  }[];
  uptimeChecks: {
    status: string;
    httpStatus: number | null;
    responseMs: number | null;
    error: string | null;
    createdAt: string;
  }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [checkingUptime, setCheckingUptime] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProject() {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load project");
      setLoading(false);
      return;
    }
    setProject(data.project);
    setLoading(false);

    if (data.project.scans.length > 0) {
      const scanRes = await fetch(`/api/projects/${projectId}/scan`);
      const scanData = await scanRes.json();
      if (scanRes.ok) {
        setReport(scanData.report);
      }
    }
  }

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function runScan() {
    setScanning(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/scan`, { method: "POST" });
    const data = await res.json();
    setScanning(false);

    if (!res.ok) {
      setError(data.error || "Scan failed");
      return;
    }

    setReport(data.report);
    await loadProject();
  }

  async function checkUptimeNow() {
    setCheckingUptime(true);
    const res = await fetch(`/api/projects/${projectId}/uptime`, { method: "POST" });
    setCheckingUptime(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Uptime check failed");
      return;
    }
    await loadProject();
  }

  async function patchProject(body: Record<string, boolean>) {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) await loadProject();
  }

  async function deleteProject() {
    const confirmed = window.confirm(
      `Delete ${project?.name}? This removes the site, scan history, and uptime checks. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete site");
      return;
    }

    router.push("/dashboard");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-center text-slate-500 sm:px-6">
        Loading project…
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-red-600">{error || "Project not found"}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← My sites
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-500">{formatUrlDisplay(project.url)}</p>
        </div>
        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {scanning ? "Scanning…" : "Run SEO scan"}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={project.monitorEnabled}
          onChange={(e) => patchProject({ monitorEnabled: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Weekly SEO scan (email if scores drop or critical issues appear)
      </label>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8">
        <UptimePanel
          uptimeEnabled={project.uptimeEnabled}
          lastUptimeStatus={project.lastUptimeStatus}
          lastUptimeAt={project.lastUptimeAt}
          lastUptimeMs={project.lastUptimeMs}
          lastUptimeHttpStatus={project.lastUptimeHttpStatus}
          lastSslExpiryDays={project.lastSslExpiryDays}
          checks={project.uptimeChecks}
          onToggle={(enabled) => patchProject({ uptimeEnabled: enabled })}
          onCheckNow={checkUptimeNow}
          checking={checkingUptime}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">SEO score history</h2>
        <div className="mt-4">
          <ScoreTrend scans={project.scans} />
        </div>
      </section>

      {report?.checklist && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Latest SEO checklist</h2>
          <SiteChecklistPanel checklist={report.checklist} />
        </section>
      )}

      {!report && !scanning && (
        <p className="mt-8 text-center text-slate-500">
          Run your first SEO scan to see the checklist and detailed results.
        </p>
      )}

      <section className="mt-10 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Delete site</h2>
        <p className="mt-2 text-sm text-slate-600">
          Remove this site from your account. All scan history and uptime data will be permanently deleted.
        </p>
        <button
          type="button"
          onClick={deleteProject}
          disabled={deleting}
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete site"}
        </button>
      </section>
    </main>
  );
}

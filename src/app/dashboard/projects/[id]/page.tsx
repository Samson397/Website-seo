"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuditReportView } from "@/components/AuditReport";
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
  const [previousReport, setPreviousReport] = useState<AuditReport | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [compareScanId, setCompareScanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [checkingUptime, setCheckingUptime] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBaselineReport(baselineScanId: string) {
    const prevRes = await fetch(`/api/projects/${projectId}/scan?scanId=${baselineScanId}`);
    const prevData = await prevRes.json();
    setPreviousReport(prevRes.ok ? prevData.report : null);
    setCompareScanId(baselineScanId);
  }

  async function loadScanReport(
    scanId: string,
    allScans: ProjectDetail["scans"],
    baselineId?: string | null
  ) {
    const res = await fetch(`/api/projects/${projectId}/scan?scanId=${scanId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load scan");
      return;
    }

    setReport(data.report);
    setSelectedScanId(scanId);

    const scanIndex = allScans.findIndex((s) => s.id === scanId);
    const defaultBaseline = scanIndex >= 0 ? allScans[scanIndex + 1]?.id : undefined;
    const baseline = baselineId ?? defaultBaseline;

    if (baseline && baseline !== scanId) {
      await loadBaselineReport(baseline);
    } else {
      setPreviousReport(null);
      setCompareScanId(null);
    }
  }

  async function loadProject(preferredScanId?: string) {
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
      const scanId = preferredScanId ?? selectedScanId ?? data.project.scans[0].id;
      await loadScanReport(scanId, data.project.scans);
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

    setPreviousReport(report);
    setReport(data.report);
    setSelectedScanId(data.scanId);
    await loadProject(data.scanId);
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

  async function selectScan(scanId: string) {
    if (!project) return;
    await loadScanReport(scanId, project.scans, compareScanId);
  }

  async function selectCompareScan(baselineId: string) {
    if (!baselineId || baselineId === selectedScanId) {
      setPreviousReport(null);
      setCompareScanId(null);
      return;
    }
    await loadBaselineReport(baselineId);
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runScan}
            disabled={scanning}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {scanning ? "Scanning…" : "Run SEO scan"}
          </button>
          <button
            type="button"
            onClick={deleteProject}
            disabled={deleting}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete site"}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={project.monitorEnabled}
            onChange={(e) => patchProject({ monitorEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Weekly SEO scan (saved to your dashboard — check anytime for score history)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={project.siteCrawl}
            onChange={(e) => patchProject({ siteCrawl: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Full site scan (discover all pages from sitemap + links)
        </label>
      </div>

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">SEO score history</h2>
          {project.scans.length > 1 && selectedScanId && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Compare to
              <select
                value={compareScanId ?? ""}
                onChange={(e) => selectCompareScan(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              >
                <option value="">No comparison</option>
                {project.scans
                  .filter((s) => s.id !== selectedScanId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.createdAt).toLocaleString()} ({s.trigger === "scheduled" ? "Weekly" : "Manual"})
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>
        <div className="mt-4">
          <ScoreTrend
            scans={project.scans}
            selectedScanId={selectedScanId ?? undefined}
            onSelectScan={selectScan}
          />
        </div>
      </section>

      {report?.checklist && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">SEO checklist</h2>
          <SiteChecklistPanel checklist={report.checklist} />
        </section>
      )}

      {report && (
        <AuditReportView
          report={report}
          previousReport={previousReport}
          onRescan={runScan}
          rescanLoading={scanning}
        />
      )}

      {!report && !scanning && (
        <p className="mt-8 text-center text-slate-500">
          Run your first SEO scan to see the full audit report.
        </p>
      )}
    </main>
  );
}

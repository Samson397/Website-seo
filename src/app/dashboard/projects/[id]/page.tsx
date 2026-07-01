"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ScoreTrend } from "@/components/dashboard/ScoreTrend";
import { SiteChecklistPanel } from "@/components/SiteChecklistPanel";
import type { AuditReport } from "@/lib/types";

interface ProjectDetail {
  id: string;
  name: string;
  url: string;
  siteCrawl: boolean;
  maxPages: number;
  monitorEnabled: boolean;
  lastScanAt: string | null;
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
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
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

  async function toggleMonitor(enabled: boolean) {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monitorEnabled: enabled }),
    });

    if (res.ok) {
      await loadProject();
    }
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
          <p className="text-sm text-slate-500">{project.url}</p>
        </div>
        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {scanning ? "Scanning…" : "Run scan now"}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={project.monitorEnabled}
          onChange={(e) => toggleMonitor(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Weekly monitoring (email alert if scores drop or critical issues appear)
      </label>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Score history</h2>
        <div className="mt-4">
          <ScoreTrend scans={project.scans} />
        </div>
      </section>

      {report?.checklist && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Latest scan checklist</h2>
          <SiteChecklistPanel checklist={report.checklist} />
        </section>
      )}

      {!report && !scanning && (
        <p className="mt-8 text-center text-slate-500">
          Run your first scan to see the checklist and detailed results.
        </p>
      )}
    </main>
  );
}

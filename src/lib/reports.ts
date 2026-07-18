import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";
import type { AuditReport } from "@/lib/types";

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function canPersistReports(): boolean {
  return Boolean(getDatabaseUrl());
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureReportsSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS shared_reports (
          id TEXT PRIMARY KEY,
          url TEXT NOT NULL,
          hostname TEXT NOT NULL,
          overall SMALLINT,
          report_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS shared_reports_created_at_idx
        ON shared_reports (created_at DESC)
      `;
      // preview = locked stash (unlock API only); shared = public /r/[id]
      await db`
        ALTER TABLE shared_reports
        ADD COLUMN IF NOT EXISTS access TEXT NOT NULL DEFAULT 'shared'
      `;
      await db`
        CREATE INDEX IF NOT EXISTS shared_reports_access_idx
        ON shared_reports (access)
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

function overallScore(report: AuditReport): number {
  return Math.round(
    (report.scores.seo +
      report.scores.performance +
      report.scores.accessibility +
      report.scores.security) /
      4
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "site";
  }
}

async function insertReport(report: AuditReport, access: "preview" | "shared"): Promise<string> {
  await ensureReportsSchema();
  const db = sql();
  const id = randomBytes(6).toString("hex");
  const reportJson = JSON.parse(JSON.stringify(report)) as AuditReport;

  await db`
    INSERT INTO shared_reports (id, url, hostname, overall, report_json, access)
    VALUES (
      ${id},
      ${report.url},
      ${hostnameOf(report.url)},
      ${overallScore(report)},
      ${reportJson},
      ${access}
    )
  `;

  return id;
}

export async function saveSharedReport(report: AuditReport): Promise<string> {
  return insertReport(report, "shared");
}

/** Stash full homepage audit for unlock-in-place (not publicly shareable). */
export async function savePreviewReport(report: AuditReport): Promise<string> {
  return insertReport({ ...report, tier: "full" }, "preview");
}

export async function getSharedReport(id: string): Promise<AuditReport | null> {
  if (!/^[a-f0-9]{12}$/i.test(id)) return null;
  await ensureReportsSchema();
  const db = sql();
  const rows = await db`
    SELECT report_json, access FROM shared_reports
    WHERE id = ${id} AND access = 'shared'
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const raw = rows[0].report_json;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as AuditReport;
}

export async function getPreviewReport(id: string): Promise<AuditReport | null> {
  if (!/^[a-f0-9]{12}$/i.test(id)) return null;
  await ensureReportsSchema();
  const db = sql();
  const rows = await db`
    SELECT report_json, access FROM shared_reports
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const raw = rows[0].report_json;
  const report = (typeof raw === "string" ? JSON.parse(raw) : raw) as AuditReport;
  return report;
}

export type AdminReportRow = {
  id: string;
  url: string;
  hostname: string;
  overall: number | null;
  access: string;
  createdAt: string;
};

/** Admin: recent shared + preview report rows (no full JSON). */
export async function listReportsAdmin(limit = 50): Promise<AdminReportRow[]> {
  if (!canPersistReports()) return [];
  await ensureReportsSchema();
  const db = sql();
  const rows = await db`
    SELECT id, url, hostname, overall, access, created_at
    FROM shared_reports
    ORDER BY created_at DESC
    LIMIT ${Math.max(1, Math.min(200, limit))}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    url: String(r.url),
    hostname: String(r.hostname),
    overall: r.overall == null ? null : Number(r.overall),
    access: String(r.access || "shared"),
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function deleteReportAdmin(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canPersistReports()) {
    return { ok: false, error: "DATABASE_URL required." };
  }
  if (!/^[a-f0-9]{12}$/i.test(id)) {
    return { ok: false, error: "Invalid report id." };
  }
  await ensureReportsSchema();
  const db = sql();
  const rows = await db`
    DELETE FROM shared_reports WHERE id = ${id} RETURNING id
  `;
  if (rows.length === 0) return { ok: false, error: "Report not found." };
  return { ok: true };
}

/** Promote a preview stash to a public shareable full report after payment. */
export async function promotePreviewToShared(
  id: string,
  report: AuditReport
): Promise<AuditReport> {
  await ensureReportsSchema();
  const db = sql();
  const full: AuditReport = {
    ...report,
    tier: "full",
    shareId: id,
    previewId: undefined,
  };
  const reportJson = JSON.parse(JSON.stringify(full)) as AuditReport;

  await db`
    UPDATE shared_reports
    SET
      report_json = ${reportJson},
      overall = ${overallScore(full)},
      access = 'shared'
    WHERE id = ${id}
  `;

  return full;
}

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

export async function saveSharedReport(report: AuditReport): Promise<string> {
  await ensureReportsSchema();
  const db = sql();
  const id = randomBytes(6).toString("hex");
  let hostname = "site";
  try {
    hostname = new URL(report.url).hostname.replace(/^www\./, "");
  } catch {
    // keep default
  }

  const reportJson = JSON.parse(JSON.stringify(report)) as AuditReport;

  await db`
    INSERT INTO shared_reports (id, url, hostname, overall, report_json)
    VALUES (
      ${id},
      ${report.url},
      ${hostname},
      ${overallScore(report)},
      ${reportJson}
    )
  `;

  return id;
}

export async function getSharedReport(id: string): Promise<AuditReport | null> {
  if (!/^[a-f0-9]{12}$/i.test(id)) return null;
  await ensureReportsSchema();
  const db = sql();
  const rows = await db`
    SELECT report_json FROM shared_reports WHERE id = ${id} LIMIT 1
  `;
  if (!rows[0]) return null;
  const raw = rows[0].report_json;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as AuditReport;
}

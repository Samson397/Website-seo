import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function canPersistEmailContacts(): boolean {
  return Boolean(getDatabaseUrl());
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureEmailContactsSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS email_contacts (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          hostname TEXT,
          url TEXT,
          source TEXT NOT NULL DEFAULT 'report',
          marketing_ok BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS email_contacts_email_idx
        ON email_contacts (email)
      `;
      await db`
        CREATE INDEX IF NOT EXISTS email_contacts_created_at_idx
        ON email_contacts (created_at DESC)
      `;
      await db`
        CREATE INDEX IF NOT EXISTS email_contacts_marketing_idx
        ON email_contacts (marketing_ok)
        WHERE marketing_ok = TRUE
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type EmailContactSource = "report" | "digest";

export type EmailContact = {
  id: string;
  email: string;
  hostname: string | null;
  url: string | null;
  source: EmailContactSource;
  marketingOk: boolean;
  createdAt: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function recordEmailContact(input: {
  email: string;
  hostname?: string | null;
  url?: string | null;
  source: EmailContactSource;
  marketingOk: boolean;
}): Promise<{ id: string; stored: boolean }> {
  if (!canPersistEmailContacts()) {
    return { id: "", stored: false };
  }

  await ensureEmailContactsSchema();
  const db = sql();
  const email = normalizeEmail(input.email);
  const id = randomBytes(8).toString("hex");
  const hostname = input.hostname?.trim() || null;
  const url = input.url?.trim() || null;
  const marketingOk = Boolean(input.marketingOk);

  // Upsert by email+source: keep marketing_ok sticky once true; refresh site context.
  const existing = await db`
    SELECT id, marketing_ok FROM email_contacts
    WHERE email = ${email} AND source = ${input.source}
    LIMIT 1
  `;

  if (existing[0]) {
    const nextMarketing = Boolean(existing[0].marketing_ok) || marketingOk;
    await db`
      UPDATE email_contacts
      SET hostname = COALESCE(${hostname}, hostname),
          url = COALESCE(${url}, url),
          marketing_ok = ${nextMarketing},
          updated_at = NOW()
      WHERE id = ${String(existing[0].id)}
    `;
    return { id: String(existing[0].id), stored: true };
  }

  await db`
    INSERT INTO email_contacts (id, email, hostname, url, source, marketing_ok)
    VALUES (${id}, ${email}, ${hostname}, ${url}, ${input.source}, ${marketingOk})
  `;
  return { id, stored: true };
}

export async function loadRecentEmailContacts(limit = 100): Promise<EmailContact[]> {
  if (!canPersistEmailContacts()) return [];
  await ensureEmailContactsSchema();
  const db = sql();
  const capped = Math.min(Math.max(limit, 1), 500);
  const rows = await db`
    SELECT id, email, hostname, url, source, marketing_ok, created_at
    FROM email_contacts
    ORDER BY created_at DESC
    LIMIT ${capped}
  `;

  return rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    hostname: row.hostname ? String(row.hostname) : null,
    url: row.url ? String(row.url) : null,
    source: (row.source === "digest" ? "digest" : "report") as EmailContactSource,
    marketingOk: Boolean(row.marketing_ok),
    createdAt: new Date(row.created_at as string).toISOString(),
  }));
}

export async function emailContactStats(): Promise<{
  total: number;
  marketingOk: number;
  bySource: { report: number; digest: number };
}> {
  if (!canPersistEmailContacts()) {
    return { total: 0, marketingOk: 0, bySource: { report: 0, digest: 0 } };
  }
  await ensureEmailContactsSchema();
  const db = sql();
  const rows = await db`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE marketing_ok)::int AS marketing_ok,
      COUNT(*) FILTER (WHERE source = 'report')::int AS report_count,
      COUNT(*) FILTER (WHERE source = 'digest')::int AS digest_count
    FROM email_contacts
  `;
  const row = rows[0];
  return {
    total: Number(row?.total || 0),
    marketingOk: Number(row?.marketing_ok || 0),
    bySource: {
      report: Number(row?.report_count || 0),
      digest: Number(row?.digest_count || 0),
    },
  };
}

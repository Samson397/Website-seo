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

export function canPersistDigests(): boolean {
  return Boolean(getDatabaseUrl());
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureDigestSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS digest_subscriptions (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          sites JSONB NOT NULL DEFAULT '[]'::jsonb,
          unsub_token TEXT NOT NULL UNIQUE,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_sent_at TIMESTAMPTZ
        )
      `;
      await db`
        CREATE UNIQUE INDEX IF NOT EXISTS digest_subscriptions_email_idx
        ON digest_subscriptions (email)
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type DigestSite = {
  url: string;
  hostname: string;
  lastOverall?: number;
};

export type DigestSubscription = {
  id: string;
  email: string;
  sites: DigestSite[];
  unsubToken: string;
  active: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function upsertDigestSubscription(
  email: string,
  sites: DigestSite[]
): Promise<{ id: string; unsubToken: string }> {
  await ensureDigestSchema();
  const db = sql();
  const normalized = normalizeEmail(email);
  const id = randomBytes(8).toString("hex");
  const unsubToken = randomBytes(16).toString("hex");
  const sitesJson = JSON.parse(JSON.stringify(sites.slice(0, 20)));

  const existing = await db`
    SELECT id, unsub_token FROM digest_subscriptions WHERE email = ${normalized} LIMIT 1
  `;

  if (existing[0]) {
    await db`
      UPDATE digest_subscriptions
      SET sites = ${sitesJson},
          active = TRUE,
          updated_at = NOW()
      WHERE email = ${normalized}
    `;
    return {
      id: String(existing[0].id),
      unsubToken: String(existing[0].unsub_token),
    };
  }

  await db`
    INSERT INTO digest_subscriptions (id, email, sites, unsub_token, active)
    VALUES (${id}, ${normalized}, ${sitesJson}, ${unsubToken}, TRUE)
  `;

  return { id, unsubToken };
}

export async function unsubscribeDigest(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{32}$/i.test(token)) return false;
  await ensureDigestSchema();
  const db = sql();
  const rows = await db`
    UPDATE digest_subscriptions
    SET active = FALSE, updated_at = NOW()
    WHERE unsub_token = ${token}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function listActiveDigests(): Promise<DigestSubscription[]> {
  await ensureDigestSchema();
  const db = sql();
  const rows = await db`
    SELECT id, email, sites, unsub_token, active
    FROM digest_subscriptions
    WHERE active = TRUE
    ORDER BY created_at ASC
    LIMIT 500
  `;

  return rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    sites: (typeof row.sites === "string" ? JSON.parse(row.sites) : row.sites) as DigestSite[],
    unsubToken: String(row.unsub_token),
    active: Boolean(row.active),
  }));
}

export async function markDigestSent(id: string): Promise<void> {
  await ensureDigestSchema();
  const db = sql();
  await db`
    UPDATE digest_subscriptions SET last_sent_at = NOW(), updated_at = NOW() WHERE id = ${id}
  `;
}

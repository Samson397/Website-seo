import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";

export interface PublicPromoCode {
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  remaining: number;
  active: boolean;
}

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function canUsePromoCodes(): boolean {
  return Boolean(getDatabaseUrl());
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

/** Default public codes — seeded once. Override with PROMO_CODES=CODE:MAX,CODE:MAX */
function seedSpecs(): { code: string; maxUses: number; label: string }[] {
  const raw = process.env.PROMO_CODES?.trim();
  if (raw) {
    return raw.split(",").flatMap((part) => {
      const [code, max] = part.trim().split(":");
      if (!code) return [];
      const maxUses = Math.max(1, Number(max) || 5);
      return [{ code: code.toUpperCase(), maxUses, label: "Promo unlock" }];
    });
  }
  return [
    { code: "FRIENDS", maxUses: 5, label: "Friends & early access" },
    { code: "LAUNCH", maxUses: 10, label: "Launch pass" },
    { code: "VIP", maxUses: 3, label: "VIP pass" },
  ];
}

async function ensurePromoSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS promo_codes (
          code TEXT PRIMARY KEY,
          label TEXT NOT NULL DEFAULT 'Promo unlock',
          max_uses INTEGER NOT NULL DEFAULT 5,
          used_count INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS promo_unlocks (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL REFERENCES promo_codes(code),
          consumed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          consumed_at TIMESTAMPTZ
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS promo_unlocks_code_idx ON promo_unlocks (code)
      `;

      for (const spec of seedSpecs()) {
        await db`
          INSERT INTO promo_codes (code, label, max_uses, used_count, active)
          VALUES (${spec.code}, ${spec.label}, ${spec.maxUses}, 0, TRUE)
          ON CONFLICT (code) DO NOTHING
        `;
      }
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export function isPromoSessionId(sessionId: string | undefined | null): boolean {
  return Boolean(sessionId && sessionId.startsWith("promo_"));
}

export async function listPublicPromoCodes(): Promise<PublicPromoCode[]> {
  if (!canUsePromoCodes()) return [];
  await ensurePromoSchema();
  const db = sql();
  const rows = await db`
    SELECT code, label, max_uses, used_count, active
    FROM promo_codes
    WHERE active = TRUE
    ORDER BY created_at ASC
  `;
  return rows.map((row) => {
    const maxUses = Number(row.max_uses);
    const usedCount = Number(row.used_count);
    return {
      code: String(row.code),
      label: String(row.label),
      maxUses,
      usedCount,
      remaining: Math.max(0, maxUses - usedCount),
      active: Boolean(row.active),
    };
  });
}

export type RedeemResult =
  | { ok: true; sessionId: string; code: string; remaining: number; usedCount: number; maxUses: number }
  | { ok: false; error: string; status: number };

/** Redeem a public code → one single-use unlock session (like one Stripe checkout). */
export async function redeemPromoCode(rawCode: string): Promise<RedeemResult> {
  if (!canUsePromoCodes()) {
    return { ok: false, error: "Promo codes need Neon / DATABASE_URL on this deployment.", status: 503 };
  }

  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (code.length < 3 || code.length > 32) {
    return { ok: false, error: "Enter a valid promo code.", status: 400 };
  }

  await ensurePromoSchema();
  const db = sql();

  // Atomic: only increment when uses remain
  const updated = await db`
    UPDATE promo_codes
    SET used_count = used_count + 1
    WHERE code = ${code}
      AND active = TRUE
      AND used_count < max_uses
    RETURNING code, label, max_uses, used_count
  `;

  if (updated.length === 0) {
    const existing = await db`
      SELECT code, max_uses, used_count, active FROM promo_codes WHERE code = ${code}
    `;
    if (existing.length === 0) {
      return { ok: false, error: "That promo code isn’t recognized.", status: 404 };
    }
    if (!existing[0].active) {
      return { ok: false, error: "That promo code is no longer active.", status: 410 };
    }
    return { ok: false, error: "That promo code is fully used.", status: 410 };
  }

  const row = updated[0];
  const sessionId = `promo_${randomBytes(16).toString("hex")}`;
  await db`
    INSERT INTO promo_unlocks (id, code, consumed)
    VALUES (${sessionId}, ${String(row.code)}, FALSE)
  `;

  const maxUses = Number(row.max_uses);
  const usedCount = Number(row.used_count);
  return {
    ok: true,
    sessionId,
    code: String(row.code),
    remaining: Math.max(0, maxUses - usedCount),
    usedCount,
    maxUses,
  };
}

export async function verifyPromoSession(sessionId: string): Promise<boolean> {
  if (!isPromoSessionId(sessionId) || !canUsePromoCodes()) return false;
  await ensurePromoSchema();
  const db = sql();
  const rows = await db`
    SELECT id FROM promo_unlocks
    WHERE id = ${sessionId} AND consumed = FALSE
  `;
  return rows.length > 0;
}

/** True if session exists (consumed OK — for AI plan after the scan). */
export async function promoSessionExists(sessionId: string): Promise<boolean> {
  if (!isPromoSessionId(sessionId) || !canUsePromoCodes()) return false;
  await ensurePromoSchema();
  const db = sql();
  const rows = await db`
    SELECT id FROM promo_unlocks WHERE id = ${sessionId}
  `;
  return rows.length > 0;
}

export async function consumePromoSession(sessionId: string): Promise<void> {
  if (!isPromoSessionId(sessionId) || !canUsePromoCodes()) return;
  await ensurePromoSchema();
  const db = sql();
  await db`
    UPDATE promo_unlocks
    SET consumed = TRUE, consumed_at = NOW()
    WHERE id = ${sessionId} AND consumed = FALSE
  `;
}

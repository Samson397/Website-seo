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

const DEFAULT_CODE = "WELCOME";
const DEFAULT_MAX = 100;
const LEGACY_CODES = ["FRIENDS", "LAUNCH", "VIP"] as const;

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

/** PROMO_CODES=WELCOME:100 — defaults to first 100 via WELCOME. */
function seedSpecs(): { code: string; maxUses: number; label: string }[] {
  const raw = process.env.PROMO_CODES?.trim();
  if (raw) {
    return raw.split(",").flatMap((part) => {
      const [code, max] = part.trim().split(":");
      if (!code) return [];
      const maxUses = Math.max(1, Number(max) || DEFAULT_MAX);
      return [
        {
          code: code.toUpperCase(),
          maxUses,
          label: "First free unlocks",
        },
      ];
    });
  }
  const maxFromEnv = Number(process.env.PROMO_MAX_USES);
  return [
    {
      code: DEFAULT_CODE,
      maxUses: Number.isFinite(maxFromEnv) && maxFromEnv > 0 ? maxFromEnv : DEFAULT_MAX,
      label: "First 100 free unlocks",
    },
  ];
}

function normalizeIp(raw: string | undefined | null): string {
  const ip = (raw || "unknown").trim().toLowerCase();
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
    // Still bind localhost in dev so repeat redeems are blocked there too
    return ip || "unknown";
  }
  return ip.slice(0, 64);
}

async function ensurePromoSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS promo_codes (
          code TEXT PRIMARY KEY,
          label TEXT NOT NULL DEFAULT 'Promo unlock',
          max_uses INTEGER NOT NULL DEFAULT 100,
          used_count INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS promo_unlocks (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL REFERENCES promo_codes(code),
          client_ip TEXT,
          consumed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          consumed_at TIMESTAMPTZ
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS promo_unlocks_code_idx ON promo_unlocks (code)
      `;
      await db`
        ALTER TABLE promo_unlocks
        ADD COLUMN IF NOT EXISTS client_ip TEXT
      `;
      // One free unlock per IP across the whole launch pass
      await db`
        CREATE TABLE IF NOT EXISTS promo_ip_claims (
          client_ip TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          unlock_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      for (const spec of seedSpecs()) {
        await db`
          INSERT INTO promo_codes (code, label, max_uses, used_count, active)
          VALUES (${spec.code}, ${spec.label}, ${spec.maxUses}, 0, TRUE)
          ON CONFLICT (code) DO UPDATE SET
            label = EXCLUDED.label,
            max_uses = EXCLUDED.max_uses,
            active = TRUE
        `;
      }

      // Retire older multi-code seeds so only the launch pass shows
      for (const legacy of LEGACY_CODES) {
        await db`
          UPDATE promo_codes SET active = FALSE WHERE code = ${legacy}
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

/**
 * Redeem a public code → one full-site unlock.
 * Enforces global pool max + one claim per IP.
 */
export async function redeemPromoCode(
  rawCode: string,
  clientIpRaw?: string | null
): Promise<RedeemResult> {
  if (!canUsePromoCodes()) {
    return { ok: false, error: "Promo codes need Neon / DATABASE_URL on this deployment.", status: 503 };
  }

  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (code.length < 3 || code.length > 32) {
    return { ok: false, error: "Enter a valid promo code.", status: 400 };
  }

  const clientIp = normalizeIp(clientIpRaw);
  await ensurePromoSchema();
  const db = sql();

  // Reserve this IP first (unique) so one network can't burn the pool
  const claimed = await db`
    INSERT INTO promo_ip_claims (client_ip, code)
    VALUES (${clientIp}, ${code})
    ON CONFLICT (client_ip) DO NOTHING
    RETURNING client_ip
  `;
  if (claimed.length === 0) {
    return {
      ok: false,
      error: "This network already claimed a free unlock. Pay $0.99 for another full scan.",
      status: 409,
    };
  }

  // Atomic pool increment
  const updated = await db`
    UPDATE promo_codes
    SET used_count = used_count + 1
    WHERE code = ${code}
      AND active = TRUE
      AND used_count < max_uses
    RETURNING code, label, max_uses, used_count
  `;

  if (updated.length === 0) {
    // Release IP reservation — pool empty or bad code
    await db`DELETE FROM promo_ip_claims WHERE client_ip = ${clientIp} AND unlock_id IS NULL`;

    const existing = await db`
      SELECT code, max_uses, used_count, active FROM promo_codes WHERE code = ${code}
    `;
    if (existing.length === 0) {
      return { ok: false, error: "That promo code isn’t recognized.", status: 404 };
    }
    if (!existing[0].active) {
      return { ok: false, error: "That promo code is no longer active.", status: 410 };
    }
    return {
      ok: false,
      error: "The free launch pass is fully claimed (first 100). Pay $0.99 for a full scan.",
      status: 410,
    };
  }

  const row = updated[0];
  const sessionId = `promo_${randomBytes(16).toString("hex")}`;
  await db`
    INSERT INTO promo_unlocks (id, code, client_ip, consumed)
    VALUES (${sessionId}, ${String(row.code)}, ${clientIp}, FALSE)
  `;
  await db`
    UPDATE promo_ip_claims
    SET unlock_id = ${sessionId}, code = ${String(row.code)}
    WHERE client_ip = ${clientIp}
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

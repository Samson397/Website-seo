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

/**
 * Configure codes via env (Vercel / host):
 *   PROMO_CODES=WELCOME:100,SPRING26:50
 * Defaults to WELCOME with first 100 (or PROMO_MAX_USES).
 * Add a new campaign later by appending another CODE:MAX entry — it is seeded on next request.
 */
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
          label: "Promo unlock",
        },
      ];
    });
  }
  const maxFromEnv = Number(process.env.PROMO_MAX_USES);
  const maxUses = Number.isFinite(maxFromEnv) && maxFromEnv > 0 ? maxFromEnv : DEFAULT_MAX;
  return [
    {
      code: DEFAULT_CODE,
      maxUses,
      label: `First ${maxUses} free unlocks`,
    },
  ];
}

function normalizeIp(raw: string | undefined | null): string {
  const ip = (raw || "unknown").trim().toLowerCase();
  if (!ip) return "unknown";
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
      await db`
        ALTER TABLE promo_unlocks
        ADD COLUMN IF NOT EXISTS preview_unlocked BOOLEAN NOT NULL DEFAULT FALSE
      `;
      await db`
        CREATE TABLE IF NOT EXISTS promo_ip_claims (
          client_ip TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          unlock_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      // Seed new codes; never overwrite used_count. Do not force-reactivate exhausted pools.
      for (const spec of seedSpecs()) {
        await db`
          INSERT INTO promo_codes (code, label, max_uses, used_count, active)
          VALUES (${spec.code}, ${spec.label}, ${spec.maxUses}, 0, TRUE)
          ON CONFLICT (code) DO NOTHING
        `;
        await db`
          UPDATE promo_codes
          SET label = ${spec.label},
              max_uses = ${spec.maxUses}
          WHERE code = ${spec.code}
        `;
      }

      for (const legacy of LEGACY_CODES) {
        await db`
          UPDATE promo_codes SET active = FALSE WHERE code = ${legacy}
        `;
      }

      // Heal used_count from real unlock rows (source of truth), including zeros
      await db`
        UPDATE promo_codes AS c
        SET used_count = (
          SELECT COUNT(*)::int FROM promo_unlocks u WHERE u.code = c.code
        )
      `;

      // Hide fully claimed codes from the public board; raising max_uses via env reactivates them.
      await db`
        UPDATE promo_codes AS c
        SET active = FALSE
        WHERE c.active = TRUE
          AND c.used_count >= c.max_uses
      `;
      for (const spec of seedSpecs()) {
        await db`
          UPDATE promo_codes
          SET active = TRUE
          WHERE code = ${spec.code}
            AND active = FALSE
            AND used_count < max_uses
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
  // Count unlocks directly so the public board can't drift / get cached wrong from used_count.
  // Only codes with remaining uses — depleted launch passes disappear from the site.
  const rows = await db`
    SELECT
      c.code,
      c.label,
      c.max_uses,
      c.active,
      COALESCE(u.cnt, 0)::int AS used_count
    FROM promo_codes c
    LEFT JOIN (
      SELECT code, COUNT(*)::int AS cnt
      FROM promo_unlocks
      GROUP BY code
    ) u ON u.code = c.code
    WHERE c.active = TRUE
      AND COALESCE(u.cnt, 0) < c.max_uses
    ORDER BY c.created_at ASC
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

  const updated = await db`
    UPDATE promo_codes
    SET used_count = used_count + 1
    WHERE code = ${code}
      AND active = TRUE
      AND used_count < max_uses
    RETURNING code, label, max_uses, used_count
  `;

  if (updated.length === 0) {
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

  // Prefer real unlock count for the response (matches public board)
  const counted = await db`
    SELECT COUNT(*)::int AS cnt FROM promo_unlocks WHERE code = ${String(row.code)}
  `;
  const maxUses = Number(row.max_uses);
  const usedCount = Number(counted[0]?.cnt ?? row.used_count);
  const remaining = Math.max(0, maxUses - usedCount);

  // Last claim — deactivate so homepage / pricing stop advertising this code.
  if (remaining <= 0) {
    await db`
      UPDATE promo_codes SET active = FALSE WHERE code = ${String(row.code)}
    `;
  }

  return {
    ok: true,
    sessionId,
    code: String(row.code),
    remaining,
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

/** One promo session may promote at most one stashed preview. */
export async function markPromoPreviewUnlock(sessionId: string): Promise<boolean> {
  if (!isPromoSessionId(sessionId) || !canUsePromoCodes()) return false;
  await ensurePromoSchema();
  const db = sql();
  const rows = await db`
    UPDATE promo_unlocks
    SET preview_unlocked = TRUE
    WHERE id = ${sessionId}
      AND consumed = FALSE
      AND preview_unlocked = FALSE
    RETURNING id
  `;
  return rows.length > 0;
}

/** Admin: all codes including inactive / exhausted. */
export async function listAllPromoCodesAdmin(): Promise<PublicPromoCode[]> {
  if (!canUsePromoCodes()) return [];
  await ensurePromoSchema();
  const db = sql();
  const rows = await db`
    SELECT
      c.code,
      c.label,
      c.max_uses,
      c.active,
      COALESCE(u.cnt, 0)::int AS used_count
    FROM promo_codes c
    LEFT JOIN (
      SELECT code, COUNT(*)::int AS cnt
      FROM promo_unlocks
      GROUP BY code
    ) u ON u.code = c.code
    ORDER BY c.created_at DESC
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

export async function createPromoCodeAdmin(input: {
  code: string;
  maxUses: number;
  label?: string;
}): Promise<{ ok: true; code: PublicPromoCode } | { ok: false; error: string }> {
  if (!canUsePromoCodes()) {
    return { ok: false, error: "DATABASE_URL required for promo codes." };
  }
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (code.length < 3 || code.length > 32) {
    return { ok: false, error: "Code must be 3–32 characters (A–Z, 0–9, _ or -)." };
  }
  const maxUses = Math.max(1, Math.min(100_000, Math.floor(Number(input.maxUses) || 0)));
  if (!maxUses) return { ok: false, error: "maxUses must be at least 1." };
  const label = (input.label || "Promo unlock").trim().slice(0, 80) || "Promo unlock";

  await ensurePromoSchema();
  const db = sql();
  try {
    await db`
      INSERT INTO promo_codes (code, label, max_uses, used_count, active)
      VALUES (${code}, ${label}, ${maxUses}, 0, TRUE)
    `;
  } catch {
    return { ok: false, error: "That code already exists. Activate it or pick another name." };
  }

  const rows = await listAllPromoCodesAdmin();
  const created = rows.find((r) => r.code === code);
  if (!created) return { ok: false, error: "Created but could not reload code." };
  return { ok: true, code: created };
}

export async function updatePromoCodeAdmin(input: {
  code: string;
  active?: boolean;
  maxUses?: number;
  label?: string;
}): Promise<{ ok: true; code: PublicPromoCode } | { ok: false; error: string }> {
  if (!canUsePromoCodes()) {
    return { ok: false, error: "DATABASE_URL required for promo codes." };
  }
  const code = input.code.trim().toUpperCase();
  await ensurePromoSchema();
  const db = sql();

  const existing = await db`SELECT code FROM promo_codes WHERE code = ${code}`;
  if (existing.length === 0) return { ok: false, error: "Code not found." };

  if (typeof input.active === "boolean") {
    await db`UPDATE promo_codes SET active = ${input.active} WHERE code = ${code}`;
  }
  if (typeof input.maxUses === "number" && Number.isFinite(input.maxUses)) {
    const maxUses = Math.max(1, Math.min(100_000, Math.floor(input.maxUses)));
    await db`UPDATE promo_codes SET max_uses = ${maxUses} WHERE code = ${code}`;
  }
  if (typeof input.label === "string" && input.label.trim()) {
    await db`UPDATE promo_codes SET label = ${input.label.trim().slice(0, 80)} WHERE code = ${code}`;
  }

  const rows = await listAllPromoCodesAdmin();
  const updated = rows.find((r) => r.code === code);
  if (!updated) return { ok: false, error: "Updated but could not reload code." };
  return { ok: true, code: updated };
}

export type PromoUnlockRow = {
  id: string;
  code: string;
  clientIp: string | null;
  consumed: boolean;
  createdAt: string;
  consumedAt: string | null;
};

export async function listPromoUnlocksAdmin(limit = 40): Promise<PromoUnlockRow[]> {
  if (!canUsePromoCodes()) return [];
  await ensurePromoSchema();
  const db = sql();
  const rows = await db`
    SELECT id, code, client_ip, consumed, created_at, consumed_at
    FROM promo_unlocks
    ORDER BY created_at DESC
    LIMIT ${Math.max(1, Math.min(200, limit))}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    code: String(r.code),
    clientIp: r.client_ip == null ? null : String(r.client_ip),
    consumed: Boolean(r.consumed),
    createdAt: new Date(r.created_at as string).toISOString(),
    consumedAt: r.consumed_at ? new Date(r.consumed_at as string).toISOString() : null,
  }));
}

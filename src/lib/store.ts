import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { kv } from "@vercel/kv";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";

/** Redis list key for Vercel KV / Upstash */
export const SCAN_EVENTS_KV_KEY = "seohub:scan_events";
export const SCAN_EVENTS_COLLECTION = "scan_events";
const MAX_EVENTS = 5000;

export type StoreBackend = "neon" | "vercel-kv" | "firebase" | "none";

type Sql = NeonQueryFunction<false, false>;

let sql: Sql | null = null;
let schemaReady: Promise<void> | null = null;

function getDatabaseUrl(): string | undefined {
  // Vercel Neon Storage injects these (same as the Neon Quickstart)
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

function isNeonConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

function isVercelKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Prefer Neon (Vercel Storage), then KV, then Firebase. */
export function getStoreBackend(): StoreBackend {
  if (isNeonConfigured()) return "neon";
  if (isVercelKvConfigured()) return "vercel-kv";
  if (isFirebaseConfigured()) return "firebase";
  return "none";
}

export function isStoreConfigured(): boolean {
  return getStoreBackend() !== "none";
}

function getSql(): Sql | null {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!sql) {
    sql = neon(url);
  }
  return sql;
}

async function ensureNeonSchema() {
  const db = getSql();
  if (!db) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS scan_events (
          id BIGSERIAL PRIMARY KEY,
          hostname TEXT NOT NULL,
          tld TEXT,
          overall SMALLINT,
          seo SMALLINT,
          performance SMALLINT,
          accessibility SMALLINT,
          security SMALLINT,
          pass_count SMALLINT,
          fail_count SMALLINT,
          attention_count SMALLINT,
          pages_scanned INTEGER,
          critical_issues SMALLINT,
          warning_issues SMALLINT,
          scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS technologies JSONB DEFAULT '[]'::jsonb`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS top_fail_ids JSONB DEFAULT '[]'::jsonb`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS ai_score SMALLINT`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS lcp TEXT`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS cls TEXT`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS inp TEXT`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS tier TEXT`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS has_spf BOOLEAN`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS has_dmarc BOOLEAN`;
      await db`ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS has_ssl BOOLEAN`;
      await db`
        CREATE INDEX IF NOT EXISTS scan_events_scanned_at_idx
        ON scan_events (scanned_at DESC)
      `;
      await db`
        CREATE INDEX IF NOT EXISTS scan_events_hostname_idx
        ON scan_events (hostname)
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export interface ScanEventInput {
  hostname: string;
  tld: string;
  overall: number;
  seo: number;
  performance: number;
  accessibility: number;
  security: number;
  passCount: number;
  failCount: number;
  attentionCount: number;
  pagesScanned: number;
  criticalIssues: number;
  warningIssues: number;
  scannedAt: string;
  technologies?: string[];
  topFailIds?: string[];
  aiScore?: number | null;
  lcp?: string | null;
  cls?: string | null;
  inp?: string | null;
  tier?: "free" | "full" | null;
  hasSpf?: boolean | null;
  hasDmarc?: boolean | null;
  hasSsl?: boolean | null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map((v) => String(v)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeEvent(event: ScanEventInput): ScanEventInput {
  return {
    ...event,
    technologies: (event.technologies || []).map((t) => t.trim()).filter(Boolean).slice(0, 15),
    topFailIds: (event.topFailIds || []).map((t) => t.trim()).filter(Boolean).slice(0, 10),
    aiScore: typeof event.aiScore === "number" ? event.aiScore : null,
    lcp: event.lcp || null,
    cls: event.cls || null,
    inp: event.inp || null,
    tier: event.tier === "full" || event.tier === "free" ? event.tier : null,
    hasSpf: typeof event.hasSpf === "boolean" ? event.hasSpf : null,
    hasDmarc: typeof event.hasDmarc === "boolean" ? event.hasDmarc : null,
    hasSsl: typeof event.hasSsl === "boolean" ? event.hasSsl : null,
  };
}

export async function insertScanEvent(event: ScanEventInput): Promise<boolean> {
  const backend = getStoreBackend();
  if (backend === "none") return false;
  const normalized = normalizeEvent(event);

  if (backend === "neon") {
    const db = getSql();
    if (!db) return false;
    await ensureNeonSchema();
    const technologies = JSON.parse(JSON.stringify(normalized.technologies));
    const topFailIds = JSON.parse(JSON.stringify(normalized.topFailIds));
    await db`
      INSERT INTO scan_events (
        hostname, tld, overall, seo, performance, accessibility, security,
        pass_count, fail_count, attention_count, pages_scanned,
        critical_issues, warning_issues, scanned_at,
        technologies, top_fail_ids, ai_score, lcp, cls, inp, tier,
        has_spf, has_dmarc, has_ssl
      ) VALUES (
        ${normalized.hostname}, ${normalized.tld}, ${normalized.overall},
        ${normalized.seo}, ${normalized.performance}, ${normalized.accessibility}, ${normalized.security},
        ${normalized.passCount}, ${normalized.failCount}, ${normalized.attentionCount}, ${normalized.pagesScanned},
        ${normalized.criticalIssues}, ${normalized.warningIssues}, ${normalized.scannedAt},
        ${technologies}, ${topFailIds}, ${normalized.aiScore}, ${normalized.lcp}, ${normalized.cls},
        ${normalized.inp}, ${normalized.tier}, ${normalized.hasSpf}, ${normalized.hasDmarc}, ${normalized.hasSsl}
      )
    `;
    return true;
  }

  const row = {
    ...normalized,
    createdAt: new Date().toISOString(),
  };

  if (backend === "vercel-kv") {
    await kv.lpush(SCAN_EVENTS_KV_KEY, JSON.stringify(row));
    await kv.ltrim(SCAN_EVENTS_KV_KEY, 0, MAX_EVENTS - 1);
    return true;
  }

  const firestore = getFirebaseDb();
  if (!firestore) return false;
  await firestore.collection(SCAN_EVENTS_COLLECTION).add(row);
  return true;
}

export interface BenchmarkStats {
  sampleSize: number;
  avgOverall: number;
  avgSeo: number;
  avgPerformance: number;
  avgAccessibility: number;
  avgSecurity: number;
  avgAi: number;
  avgFailCount: number;
  topTlds: { tld: string; count: number }[];
  topTechnologies: { name: string; count: number }[];
  topFailIds: { id: string; count: number }[];
  freeVsFull: { free: number; full: number; unknown: number };
  recentHosts: { hostname: string; overall: number; scannedAt: string }[];
}

const FALLBACK_BENCHMARKS: BenchmarkStats = {
  sampleSize: 0,
  avgOverall: 68,
  avgSeo: 70,
  avgPerformance: 65,
  avgAccessibility: 72,
  avgSecurity: 64,
  avgAi: 55,
  avgFailCount: 8,
  topTlds: [
    { tld: "com", count: 0 },
    { tld: "co.uk", count: 0 },
    { tld: "io", count: 0 },
  ],
  topTechnologies: [],
  topFailIds: [],
  freeVsFull: { free: 0, full: 0, unknown: 0 },
  recentHosts: [],
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function topCounts(
  values: string[],
  limit: number
): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function computeBenchmarks(
  events: ScanEventInput[]
): BenchmarkStats & { source: "live" | "seed" } {
  const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => {
    const t = Date.parse(e.scannedAt);
    return Number.isFinite(t) && t >= since;
  });

  const sampleSize = recent.length;
  if (sampleSize < 5) {
    return {
      ...FALLBACK_BENCHMARKS,
      sampleSize,
      freeVsFull: {
        free: recent.filter((e) => e.tier === "free").length,
        full: recent.filter((e) => e.tier === "full").length,
        unknown: recent.filter((e) => e.tier !== "free" && e.tier !== "full").length,
      },
      source: sampleSize > 0 ? "live" : "seed",
    };
  }

  const tldCounts = topCounts(
    recent.map((e) => e.tld).filter(Boolean),
    8
  ).map(({ key, count }) => ({ tld: key, count }));

  const topTechnologies = topCounts(
    recent.flatMap((e) => e.technologies || []),
    12
  ).map(({ key, count }) => ({ name: key, count }));

  const topFailIds = topCounts(
    recent.flatMap((e) => e.topFailIds || []),
    12
  ).map(({ key, count }) => ({ id: key, count }));

  const latestByHost = new Map<string, { hostname: string; overall: number; scannedAt: string }>();
  for (const e of recent) {
    if (!latestByHost.has(e.hostname)) {
      latestByHost.set(e.hostname, {
        hostname: e.hostname,
        overall: e.overall,
        scannedAt: e.scannedAt,
      });
    }
  }

  const aiScores = recent
    .map((e) => e.aiScore)
    .filter((n): n is number => typeof n === "number");

  return {
    sampleSize,
    avgOverall: avg(recent.map((e) => e.overall)),
    avgSeo: avg(recent.map((e) => e.seo)),
    avgPerformance: avg(recent.map((e) => e.performance)),
    avgAccessibility: avg(recent.map((e) => e.accessibility)),
    avgSecurity: avg(recent.map((e) => e.security)),
    avgAi: avg(aiScores),
    avgFailCount: avg(recent.map((e) => e.failCount)),
    topTlds: tldCounts,
    topTechnologies,
    topFailIds,
    freeVsFull: {
      free: recent.filter((e) => e.tier === "free").length,
      full: recent.filter((e) => e.tier === "full").length,
      unknown: recent.filter((e) => e.tier !== "free" && e.tier !== "full").length,
    },
    recentHosts: Array.from(latestByHost.values())
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 12),
    source: "live",
  };
}

function mapNeonRow(r: Record<string, unknown>): ScanEventInput {
  const tierRaw = r.tier != null ? String(r.tier) : null;
  return {
    hostname: String(r.hostname),
    tld: String(r.tld || ""),
    overall: Number(r.overall),
    seo: Number(r.seo),
    performance: Number(r.performance),
    accessibility: Number(r.accessibility),
    security: Number(r.security),
    passCount: Number(r.pass_count),
    failCount: Number(r.fail_count),
    attentionCount: Number(r.attention_count),
    pagesScanned: Number(r.pages_scanned),
    criticalIssues: Number(r.critical_issues),
    warningIssues: Number(r.warning_issues),
    scannedAt: new Date(r.scanned_at as string).toISOString(),
    technologies: asStringArray(r.technologies),
    topFailIds: asStringArray(r.top_fail_ids),
    aiScore: r.ai_score == null ? null : Number(r.ai_score),
    lcp: r.lcp != null ? String(r.lcp) : null,
    cls: r.cls != null ? String(r.cls) : null,
    inp: r.inp != null ? String(r.inp) : null,
    tier: tierRaw === "full" || tierRaw === "free" ? tierRaw : null,
    hasSpf: typeof r.has_spf === "boolean" ? r.has_spf : null,
    hasDmarc: typeof r.has_dmarc === "boolean" ? r.has_dmarc : null,
    hasSsl: typeof r.has_ssl === "boolean" ? r.has_ssl : null,
  };
}

async function loadEventsFromNeon(): Promise<ScanEventInput[]> {
  const db = getSql();
  if (!db) return [];
  await ensureNeonSchema();
  const rows = await db`
    SELECT
      hostname, tld, overall, seo, performance, accessibility, security,
      pass_count, fail_count, attention_count, pages_scanned,
      critical_issues, warning_issues, scanned_at,
      technologies, top_fail_ids, ai_score, lcp, cls, inp, tier,
      has_spf, has_dmarc, has_ssl
    FROM scan_events
    ORDER BY scanned_at DESC
    LIMIT 500
  `;

  return rows.map((r) => mapNeonRow(r as Record<string, unknown>));
}

async function loadEventsFromKv(): Promise<ScanEventInput[]> {
  const raw = await kv.lrange<string>(SCAN_EVENTS_KV_KEY, 0, 499);
  return raw
    .map((item) => {
      try {
        return normalizeEvent(
          (typeof item === "string" ? JSON.parse(item) : item) as ScanEventInput
        );
      } catch {
        return null;
      }
    })
    .filter((e): e is ScanEventInput => Boolean(e?.hostname && e?.scannedAt));
}

async function loadEventsFromFirebase(): Promise<ScanEventInput[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await db
    .collection(SCAN_EVENTS_COLLECTION)
    .orderBy("scannedAt", "desc")
    .limit(500)
    .get();
  return snap.docs.map((doc) => normalizeEvent(doc.data() as ScanEventInput));
}

export async function loadRecentEvents(limit = 100): Promise<ScanEventInput[]> {
  const backend = getStoreBackend();
  if (backend === "neon") {
    const all = await loadEventsFromNeon();
    return all.slice(0, limit);
  }
  if (backend === "vercel-kv") {
    return (await loadEventsFromKv()).slice(0, limit);
  }
  if (backend === "firebase") {
    return (await loadEventsFromFirebase()).slice(0, limit);
  }
  return [];
}

export async function getBenchmarkStats(): Promise<
  BenchmarkStats & { source: "live" | "seed"; backend: StoreBackend }
> {
  const backend = getStoreBackend();
  if (backend === "none") {
    return { ...FALLBACK_BENCHMARKS, source: "seed", backend };
  }

  try {
    let events: ScanEventInput[] = [];
    if (backend === "neon") events = await loadEventsFromNeon();
    else if (backend === "vercel-kv") events = await loadEventsFromKv();
    else events = await loadEventsFromFirebase();

    return { ...computeBenchmarks(events), backend };
  } catch (err) {
    console.error("[store] benchmarks failed", err instanceof Error ? err.message : err);
    return { ...FALLBACK_BENCHMARKS, source: "seed", backend };
  }
}

/** Optional extra forward to Zapier / Make / n8n. */
export async function forwardWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.DATA_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, sentAt: new Date().toISOString() }),
    });
  } catch {
    // non-blocking
  }
}

import postgres from "postgres";
import { kv } from "@vercel/kv";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";

/** Redis list key for Vercel KV / Upstash */
export const SCAN_EVENTS_KV_KEY = "seoscan:scan_events";
export const SCAN_EVENTS_COLLECTION = "scan_events";
const MAX_EVENTS = 5000;

export type StoreBackend = "neon" | "vercel-kv" | "firebase" | "none";

let sql: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getDatabaseUrl(): string | undefined {
  // Vercel Neon / Postgres Storage usually provides one of these
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

/** Prefer Neon (what you already have on Vercel), then KV, then Firebase. */
export function getStoreBackend(): StoreBackend {
  if (isNeonConfigured()) return "neon";
  if (isVercelKvConfigured()) return "vercel-kv";
  if (isFirebaseConfigured()) return "firebase";
  return "none";
}

export function isStoreConfigured(): boolean {
  return getStoreBackend() !== "none";
}

function getSql() {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!sql) {
    sql = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
      prepare: false, // better with Neon pooled connections
    });
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
}

export async function insertScanEvent(event: ScanEventInput): Promise<boolean> {
  const backend = getStoreBackend();
  if (backend === "none") return false;

  if (backend === "neon") {
    const db = getSql();
    if (!db) return false;
    await ensureNeonSchema();
    await db`
      INSERT INTO scan_events (
        hostname, tld, overall, seo, performance, accessibility, security,
        pass_count, fail_count, attention_count, pages_scanned,
        critical_issues, warning_issues, scanned_at
      ) VALUES (
        ${event.hostname}, ${event.tld}, ${event.overall},
        ${event.seo}, ${event.performance}, ${event.accessibility}, ${event.security},
        ${event.passCount}, ${event.failCount}, ${event.attentionCount}, ${event.pagesScanned},
        ${event.criticalIssues}, ${event.warningIssues}, ${event.scannedAt}
      )
    `;
    return true;
  }

  const row = {
    ...event,
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
  avgFailCount: number;
  topTlds: { tld: string; count: number }[];
  recentHosts: { hostname: string; overall: number; scannedAt: string }[];
}

const FALLBACK_BENCHMARKS: BenchmarkStats = {
  sampleSize: 0,
  avgOverall: 68,
  avgSeo: 70,
  avgPerformance: 65,
  avgAccessibility: 72,
  avgSecurity: 64,
  avgFailCount: 8,
  topTlds: [
    { tld: "com", count: 0 },
    { tld: "co.uk", count: 0 },
    { tld: "io", count: 0 },
  ],
  recentHosts: [],
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
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
      source: sampleSize > 0 ? "live" : "seed",
    };
  }

  const tldCounts = new Map<string, number>();
  for (const e of recent) {
    if (!e.tld) continue;
    tldCounts.set(e.tld, (tldCounts.get(e.tld) || 0) + 1);
  }

  const topTlds = Array.from(tldCounts.entries())
    .map(([tld, count]) => ({ tld, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

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

  return {
    sampleSize,
    avgOverall: avg(recent.map((e) => e.overall)),
    avgSeo: avg(recent.map((e) => e.seo)),
    avgPerformance: avg(recent.map((e) => e.performance)),
    avgAccessibility: avg(recent.map((e) => e.accessibility)),
    avgSecurity: avg(recent.map((e) => e.security)),
    avgFailCount: avg(recent.map((e) => e.failCount)),
    topTlds,
    recentHosts: Array.from(latestByHost.values())
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 12),
    source: "live",
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
      critical_issues, warning_issues, scanned_at
    FROM scan_events
    ORDER BY scanned_at DESC
    LIMIT 500
  `;

  return rows.map((r) => ({
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
  }));
}

async function loadEventsFromKv(): Promise<ScanEventInput[]> {
  const raw = await kv.lrange<string>(SCAN_EVENTS_KV_KEY, 0, 499);
  return raw
    .map((item) => {
      try {
        return (typeof item === "string" ? JSON.parse(item) : item) as ScanEventInput;
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
  return snap.docs.map((doc) => doc.data() as ScanEventInput);
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

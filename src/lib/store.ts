import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;
let ready: Promise<void> | null = null;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!sql) {
    sql = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 10 });
  }
  return sql;
}

export function isStoreConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function ensureSchema() {
  const db = getSql();
  if (!db) return;
  if (!ready) {
    ready = (async () => {
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
        CREATE INDEX IF NOT EXISTS scan_events_scanned_at_idx ON scan_events (scanned_at DESC)
      `;
      await db`
        CREATE INDEX IF NOT EXISTS scan_events_hostname_idx ON scan_events (hostname)
      `;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
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
  const db = getSql();
  if (!db) return false;
  await ensureSchema();
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

export async function getBenchmarkStats(): Promise<BenchmarkStats & { source: "live" | "seed" }> {
  const db = getSql();
  if (!db) return { ...FALLBACK_BENCHMARKS, source: "seed" };

  try {
    await ensureSchema();
    const [avg] = await db`
      SELECT
        COUNT(*)::int AS sample_size,
        COALESCE(ROUND(AVG(overall)), 0)::int AS avg_overall,
        COALESCE(ROUND(AVG(seo)), 0)::int AS avg_seo,
        COALESCE(ROUND(AVG(performance)), 0)::int AS avg_performance,
        COALESCE(ROUND(AVG(accessibility)), 0)::int AS avg_accessibility,
        COALESCE(ROUND(AVG(security)), 0)::int AS avg_security,
        COALESCE(ROUND(AVG(fail_count)), 0)::int AS avg_fail_count
      FROM scan_events
      WHERE scanned_at > NOW() - INTERVAL '90 days'
    `;

    const sampleSize = Number(avg?.sample_size ?? 0);
    if (sampleSize < 5) {
      return { ...FALLBACK_BENCHMARKS, sampleSize, source: sampleSize > 0 ? "live" : "seed" };
    }

    const tlds = await db`
      SELECT tld, COUNT(*)::int AS count
      FROM scan_events
      WHERE scanned_at > NOW() - INTERVAL '90 days' AND tld IS NOT NULL
      GROUP BY tld
      ORDER BY count DESC
      LIMIT 8
    `;

    const recent = await db`
      SELECT DISTINCT ON (hostname) hostname, overall, scanned_at
      FROM scan_events
      WHERE scanned_at > NOW() - INTERVAL '14 days'
      ORDER BY hostname, scanned_at DESC
      LIMIT 20
    `;

    return {
      sampleSize,
      avgOverall: Number(avg.avg_overall),
      avgSeo: Number(avg.avg_seo),
      avgPerformance: Number(avg.avg_performance),
      avgAccessibility: Number(avg.avg_accessibility),
      avgSecurity: Number(avg.avg_security),
      avgFailCount: Number(avg.avg_fail_count),
      topTlds: tlds.map((r) => ({ tld: String(r.tld), count: Number(r.count) })),
      recentHosts: recent
        .map((r) => ({
          hostname: String(r.hostname),
          overall: Number(r.overall),
          scannedAt: new Date(r.scanned_at as string).toISOString(),
        }))
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 12),
      source: "live",
    };
  } catch {
    return { ...FALLBACK_BENCHMARKS, source: "seed" };
  }
}

/** Forward lead/event payloads to an optional webhook (Zapier / Make / n8n). */
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

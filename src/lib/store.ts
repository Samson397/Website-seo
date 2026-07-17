import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";

export const SCAN_EVENTS_COLLECTION = "scan_events";

export function isStoreConfigured(): boolean {
  return isFirebaseConfigured();
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
  const db = getFirebaseDb();
  if (!db) return false;

  await db.collection(SCAN_EVENTS_COLLECTION).add({
    hostname: event.hostname,
    tld: event.tld,
    overall: event.overall,
    seo: event.seo,
    performance: event.performance,
    accessibility: event.accessibility,
    security: event.security,
    passCount: event.passCount,
    failCount: event.failCount,
    attentionCount: event.attentionCount,
    pagesScanned: event.pagesScanned,
    criticalIssues: event.criticalIssues,
    warningIssues: event.warningIssues,
    scannedAt: event.scannedAt,
    createdAt: new Date().toISOString(),
  });

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

export async function getBenchmarkStats(): Promise<BenchmarkStats & { source: "live" | "seed" }> {
  const db = getFirebaseDb();
  if (!db) return { ...FALLBACK_BENCHMARKS, source: "seed" };

  try {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    // Fetch recent events (cap keeps reads cheap on free Spark plan)
    const snap = await db
      .collection(SCAN_EVENTS_COLLECTION)
      .orderBy("scannedAt", "desc")
      .limit(500)
      .get();

    const events = snap.docs
      .map((doc) => doc.data() as ScanEventInput)
      .filter((e) => {
        const t = Date.parse(e.scannedAt);
        return Number.isFinite(t) && t >= since.getTime();
      });

    const sampleSize = events.length;
    if (sampleSize < 5) {
      return {
        ...FALLBACK_BENCHMARKS,
        sampleSize,
        source: sampleSize > 0 ? "live" : "seed",
      };
    }

    const tldCounts = new Map<string, number>();
    for (const e of events) {
      if (!e.tld) continue;
      tldCounts.set(e.tld, (tldCounts.get(e.tld) || 0) + 1);
    }

    const topTlds = Array.from(tldCounts.entries())
      .map(([tld, count]) => ({ tld, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const latestByHost = new Map<string, { hostname: string; overall: number; scannedAt: string }>();
    for (const e of events) {
      if (!latestByHost.has(e.hostname)) {
        latestByHost.set(e.hostname, {
          hostname: e.hostname,
          overall: e.overall,
          scannedAt: e.scannedAt,
        });
      }
    }

    const recentHosts = Array.from(latestByHost.values())
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 12);

    return {
      sampleSize,
      avgOverall: avg(events.map((e) => e.overall)),
      avgSeo: avg(events.map((e) => e.seo)),
      avgPerformance: avg(events.map((e) => e.performance)),
      avgAccessibility: avg(events.map((e) => e.accessibility)),
      avgSecurity: avg(events.map((e) => e.security)),
      avgFailCount: avg(events.map((e) => e.failCount)),
      topTlds,
      recentHosts,
      source: "live",
    };
  } catch (err) {
    console.error("[firebase] benchmarks failed", err instanceof Error ? err.message : err);
    return { ...FALLBACK_BENCHMARKS, source: "seed" };
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

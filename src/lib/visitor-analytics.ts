import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function canUseVisitorAnalytics(): boolean {
  return Boolean(getDatabaseUrl());
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureVisitorSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS page_views (
          id BIGSERIAL PRIMARY KEY,
          visitor_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          path TEXT NOT NULL,
          referrer TEXT,
          country TEXT,
          region TEXT,
          city TEXT,
          device TEXT,
          browser TEXT,
          ip_hash TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS visitor_presence (
          visitor_id TEXT PRIMARY KEY,
          last_path TEXT,
          country TEXT,
          region TEXT,
          city TEXT,
          device TEXT,
          browser TEXT,
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS page_views_visitor_id_idx ON page_views (visitor_id)`;
      await db`CREATE INDEX IF NOT EXISTS page_views_path_idx ON page_views (path)`;
      await db`CREATE INDEX IF NOT EXISTS page_views_country_idx ON page_views (country)`;
      await db`CREATE INDEX IF NOT EXISTS visitor_presence_last_seen_idx ON visitor_presence (last_seen_at DESC)`;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type VisitInput = {
  visitorId: string;
  sessionId: string;
  path: string;
  referrer?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  device?: string | null;
  browser?: string | null;
  ipHash?: string | null;
  /** When true, only refresh presence (heartbeat), do not insert a page view. */
  heartbeat?: boolean;
};

function cleanText(value: string | null | undefined, max: number): string | null {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function parseUserAgent(uaRaw: string | null | undefined): {
  device: string;
  browser: string;
} {
  const ua = (uaRaw || "").toLowerCase();
  let device = "desktop";
  if (/bot|crawl|spider|slurp|preview/i.test(ua)) device = "bot";
  else if (/ipad|tablet|kindle|silk/i.test(ua)) device = "tablet";
  else if (/mobi|iphone|android.*mobile|opera mini/i.test(ua)) device = "mobile";

  let browser = "other";
  if (ua.includes("edg/")) browser = "edge";
  else if (ua.includes("chrome/") && !ua.includes("edg/")) browser = "chrome";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "safari";
  else if (ua.includes("firefox/")) browser = "firefox";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "opera";

  return { device, browser };
}

export async function recordVisit(input: VisitInput): Promise<{ ok: boolean }> {
  if (!canUseVisitorAnalytics()) return { ok: false };
  await ensureVisitorSchema();
  const db = sql();

  const visitorId = cleanText(input.visitorId, 64);
  const sessionId = cleanText(input.sessionId, 64);
  const path = cleanText(input.path, 500);
  if (!visitorId || !sessionId || !path) return { ok: false };

  const referrer = cleanText(input.referrer, 500);
  const country = cleanText(input.country, 8);
  const region = cleanText(input.region, 64);
  const city = cleanText(input.city, 64);
  const device = cleanText(input.device, 32);
  const browser = cleanText(input.browser, 32);
  const ipHash = cleanText(input.ipHash, 64);

  if (!input.heartbeat) {
    await db`
      INSERT INTO page_views (
        visitor_id, session_id, path, referrer, country, region, city, device, browser, ip_hash
      ) VALUES (
        ${visitorId}, ${sessionId}, ${path}, ${referrer}, ${country}, ${region}, ${city},
        ${device}, ${browser}, ${ipHash}
      )
    `;
  }

  await db`
    INSERT INTO visitor_presence (
      visitor_id, last_path, country, region, city, device, browser, last_seen_at
    ) VALUES (
      ${visitorId}, ${path}, ${country}, ${region}, ${city}, ${device}, ${browser}, NOW()
    )
    ON CONFLICT (visitor_id) DO UPDATE SET
      last_path = EXCLUDED.last_path,
      country = COALESCE(EXCLUDED.country, visitor_presence.country),
      region = COALESCE(EXCLUDED.region, visitor_presence.region),
      city = COALESCE(EXCLUDED.city, visitor_presence.city),
      device = COALESCE(EXCLUDED.device, visitor_presence.device),
      browser = COALESCE(EXCLUDED.browser, visitor_presence.browser),
      last_seen_at = NOW()
  `;

  return { ok: true };
}

export type NamedCount = { name: string; count: number };

export type VisitorAnalyticsSummary = {
  configured: boolean;
  onlineNow: number;
  onlineWindowMinutes: number;
  totals: {
    viewsToday: number;
    views7d: number;
    views30d: number;
    uniqueToday: number;
    unique7d: number;
    unique30d: number;
  };
  countries: NamedCount[];
  pages: NamedCount[];
  referrers: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  hourly: { hour: string; count: number }[];
  online: {
    visitorId: string;
    lastPath: string | null;
    country: string | null;
    city: string | null;
    device: string | null;
    lastSeenAt: string;
  }[];
  recent: {
    path: string;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    referrer: string | null;
    createdAt: string;
  }[];
};

function asCountRows(rows: { name: string | null; count: string | number | null }[]): NamedCount[] {
  return rows
    .map((r) => ({
      name: (r.name || "Unknown").trim() || "Unknown",
      count: Number(r.count || 0),
    }))
    .filter((r) => r.count > 0);
}

export async function getVisitorAnalyticsSummary(
  opts: { onlineMinutes?: number } = {}
): Promise<VisitorAnalyticsSummary> {
  const onlineWindowMinutes = opts.onlineMinutes ?? 5;
  const empty: VisitorAnalyticsSummary = {
    configured: canUseVisitorAnalytics(),
    onlineNow: 0,
    onlineWindowMinutes,
    totals: {
      viewsToday: 0,
      views7d: 0,
      views30d: 0,
      uniqueToday: 0,
      unique7d: 0,
      unique30d: 0,
    },
    countries: [],
    pages: [],
    referrers: [],
    devices: [],
    browsers: [],
    hourly: [],
    online: [],
    recent: [],
  };

  if (!canUseVisitorAnalytics()) return empty;
  await ensureVisitorSchema();
  const db = sql();

  const [
    totalsRows,
    countryRows,
    pageRows,
    referrerRows,
    deviceRows,
    browserRows,
    hourlyRows,
    onlineRows,
    recentRows,
  ] = await Promise.all([
    db`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS views_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS views_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS views_30d,
        COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS unique_today,
        COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS unique_7d,
        COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS unique_30d
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `,
    db`
      SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 15
    `,
    db`
      SELECT path AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY path
      ORDER BY count DESC
      LIMIT 15
    `,
    db`
      SELECT
        CASE
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct / none'
          ELSE regexp_replace(referrer, '^https?://([^/]+).*$', '\\1')
        END AS name,
        COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 15
    `,
    db`
      SELECT COALESCE(NULLIF(device, ''), 'unknown') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY count DESC
    `,
    db`
      SELECT COALESCE(NULLIF(browser, ''), 'other') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY count DESC
    `,
    db`
      SELECT to_char(date_trunc('hour', created_at), 'YYYY-MM-DD"T"HH24:00:00"Z"') AS hour,
             COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    db`
      SELECT visitor_id, last_path, country, city, device, last_seen_at
      FROM visitor_presence
      WHERE last_seen_at >= NOW() - make_interval(mins => ${onlineWindowMinutes})
      ORDER BY last_seen_at DESC
      LIMIT 50
    `,
    db`
      SELECT path, country, city, device, browser, referrer, created_at
      FROM page_views
      ORDER BY created_at DESC
      LIMIT 40
    `,
  ]);

  const t = totalsRows[0] || {};

  return {
    configured: true,
    onlineNow: onlineRows.length,
    onlineWindowMinutes,
    totals: {
      viewsToday: Number(t.views_today || 0),
      views7d: Number(t.views_7d || 0),
      views30d: Number(t.views_30d || 0),
      uniqueToday: Number(t.unique_today || 0),
      unique7d: Number(t.unique_7d || 0),
      unique30d: Number(t.unique_30d || 0),
    },
    countries: asCountRows(countryRows as { name: string | null; count: string | number | null }[]),
    pages: asCountRows(pageRows as { name: string | null; count: string | number | null }[]),
    referrers: asCountRows(referrerRows as { name: string | null; count: string | number | null }[]),
    devices: asCountRows(deviceRows as { name: string | null; count: string | number | null }[]),
    browsers: asCountRows(browserRows as { name: string | null; count: string | number | null }[]),
    hourly: (hourlyRows as { hour: string; count: string | number }[]).map((r) => ({
      hour: String(r.hour),
      count: Number(r.count || 0),
    })),
    online: (
      onlineRows as {
        visitor_id: string;
        last_path: string | null;
        country: string | null;
        city: string | null;
        device: string | null;
        last_seen_at: string | Date;
      }[]
    ).map((r) => ({
      visitorId: r.visitor_id,
      lastPath: r.last_path,
      country: r.country,
      city: r.city,
      device: r.device,
      lastSeenAt: new Date(r.last_seen_at).toISOString(),
    })),
    recent: (
      recentRows as {
        path: string;
        country: string | null;
        city: string | null;
        device: string | null;
        browser: string | null;
        referrer: string | null;
        created_at: string | Date;
      }[]
    ).map((r) => ({
      path: r.path,
      country: r.country,
      city: r.city,
      device: r.device,
      browser: r.browser,
      referrer: r.referrer,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
}

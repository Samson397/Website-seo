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
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          utm_content TEXT,
          utm_term TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      // Older installs may lack UTM columns
      await db`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_source TEXT`;
      await db`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_medium TEXT`;
      await db`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_campaign TEXT`;
      await db`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_content TEXT`;
      await db`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_term TEXT`;

      await db`
        CREATE TABLE IF NOT EXISTS visitor_presence (
          visitor_id TEXT PRIMARY KEY,
          last_path TEXT,
          country TEXT,
          region TEXT,
          city TEXT,
          device TEXT,
          browser TEXT,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`ALTER TABLE visitor_presence ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

      await db`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id BIGSERIAL PRIMARY KEY,
          visitor_id TEXT,
          session_id TEXT,
          event_type TEXT NOT NULL,
          path TEXT,
          meta JSONB,
          country TEXT,
          ip_hash TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS analytics_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await db`CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS page_views_visitor_id_idx ON page_views (visitor_id)`;
      await db`CREATE INDEX IF NOT EXISTS page_views_path_idx ON page_views (path)`;
      await db`CREATE INDEX IF NOT EXISTS page_views_country_idx ON page_views (country)`;
      await db`CREATE INDEX IF NOT EXISTS page_views_utm_source_idx ON page_views (utm_source)`;
      await db`CREATE INDEX IF NOT EXISTS visitor_presence_last_seen_idx ON visitor_presence (last_seen_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events (event_type, created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx ON analytics_events (visitor_id)`;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type AnalyticsSettings = {
  enabled: boolean;
  blockBots: boolean;
  blockedCountries: string[];
  blockedIpHashes: string[];
  blockedPathPrefixes: string[];
  digestEnabled: boolean;
  digestEmail: string;
};

const DEFAULT_SETTINGS: AnalyticsSettings = {
  enabled: true,
  blockBots: true,
  blockedCountries: [],
  blockedIpHashes: [],
  blockedPathPrefixes: [],
  digestEnabled: false,
  digestEmail: "",
};

function cleanText(value: string | null | undefined, max: number): string | null {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
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
  if (/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram/i.test(ua)) {
    device = "bot";
  } else if (/ipad|tablet|kindle|silk/i.test(ua)) device = "tablet";
  else if (/mobi|iphone|android.*mobile|opera mini/i.test(ua)) device = "mobile";

  let browser = "other";
  if (ua.includes("edg/")) browser = "edge";
  else if (ua.includes("chrome/") && !ua.includes("edg/")) browser = "chrome";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "safari";
  else if (ua.includes("firefox/")) browser = "firefox";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "opera";

  return { device, browser };
}

export function parseUtmsFromPath(pathWithQuery: string): {
  path: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
} {
  const qIndex = pathWithQuery.indexOf("?");
  if (qIndex < 0) {
    return {
      path: pathWithQuery.slice(0, 500),
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    };
  }
  const path = pathWithQuery.slice(0, qIndex).slice(0, 500) || "/";
  const qs = pathWithQuery.slice(qIndex + 1);
  const params = new URLSearchParams(qs);
  return {
    path,
    utmSource: cleanText(params.get("utm_source"), 120),
    utmMedium: cleanText(params.get("utm_medium"), 120),
    utmCampaign: cleanText(params.get("utm_campaign"), 120),
    utmContent: cleanText(params.get("utm_content"), 120),
    utmTerm: cleanText(params.get("utm_term"), 120),
  };
}

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  if (!canUseVisitorAnalytics()) return { ...DEFAULT_SETTINGS };
  await ensureVisitorSchema();
  const db = sql();
  const rows = (await db`SELECT key, value FROM analytics_settings`) as {
    key: string;
    value: string;
  }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    enabled: (map.get("enabled") ?? "1") !== "0",
    blockBots: (map.get("block_bots") ?? "1") !== "0",
    blockedCountries: parseList(map.get("blocked_countries")).map((c) => c.toUpperCase()),
    blockedIpHashes: parseList(map.get("blocked_ip_hashes")),
    blockedPathPrefixes: parseList(map.get("blocked_path_prefixes")),
    digestEnabled: (map.get("digest_enabled") ?? "0") === "1",
    digestEmail: (map.get("digest_email") || "").trim().slice(0, 200),
  };
}

export async function updateAnalyticsSettings(
  patch: Partial<{
    enabled: boolean;
    blockBots: boolean;
    blockedCountries: string;
    blockedIpHashes: string;
    blockedPathPrefixes: string;
    digestEnabled: boolean;
    digestEmail: string;
  }>
): Promise<AnalyticsSettings> {
  await ensureVisitorSchema();
  const db = sql();
  const entries: [string, string][] = [];
  if (typeof patch.enabled === "boolean") entries.push(["enabled", patch.enabled ? "1" : "0"]);
  if (typeof patch.blockBots === "boolean") entries.push(["block_bots", patch.blockBots ? "1" : "0"]);
  if (typeof patch.blockedCountries === "string") {
    entries.push(["blocked_countries", patch.blockedCountries.trim().slice(0, 500)]);
  }
  if (typeof patch.blockedIpHashes === "string") {
    entries.push(["blocked_ip_hashes", patch.blockedIpHashes.trim().slice(0, 2000)]);
  }
  if (typeof patch.blockedPathPrefixes === "string") {
    entries.push(["blocked_path_prefixes", patch.blockedPathPrefixes.trim().slice(0, 1000)]);
  }
  if (typeof patch.digestEnabled === "boolean") {
    entries.push(["digest_enabled", patch.digestEnabled ? "1" : "0"]);
  }
  if (typeof patch.digestEmail === "string") {
    entries.push(["digest_email", patch.digestEmail.trim().slice(0, 200)]);
  }

  for (const [key, value] of entries) {
    await db`
      INSERT INTO analytics_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
  }
  return getAnalyticsSettings();
}

export type FilterDecision =
  | { allow: true }
  | { allow: false; reason: string };

export async function shouldAcceptTraffic(input: {
  path: string;
  country?: string | null;
  ipHash?: string | null;
  device?: string | null;
}): Promise<FilterDecision> {
  const settings = await getAnalyticsSettings();
  if (!settings.enabled) return { allow: false, reason: "disabled" };
  if (settings.blockBots && input.device === "bot") return { allow: false, reason: "bot" };
  const country = (input.country || "").toUpperCase();
  if (country && settings.blockedCountries.includes(country)) {
    return { allow: false, reason: "country" };
  }
  if (input.ipHash && settings.blockedIpHashes.includes(input.ipHash)) {
    return { allow: false, reason: "ip" };
  }
  const path = input.path || "/";
  if (settings.blockedPathPrefixes.some((p) => p && path.startsWith(p))) {
    return { allow: false, reason: "path" };
  }
  return { allow: true };
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
  heartbeat?: boolean;
};

export async function recordVisit(
  input: VisitInput
): Promise<{ ok: boolean; skipped?: string }> {
  if (!canUseVisitorAnalytics()) return { ok: false, skipped: "not_configured" };
  await ensureVisitorSchema();

  const visitorId = cleanText(input.visitorId, 64);
  const sessionId = cleanText(input.sessionId, 64);
  if (!visitorId || !sessionId || !input.path) return { ok: false, skipped: "invalid" };

  const parsed = parseUtmsFromPath(input.path);
  const path = parsed.path;
  const filter = await shouldAcceptTraffic({
    path,
    country: input.country,
    ipHash: input.ipHash,
    device: input.device,
  });
  if (!filter.allow) return { ok: true, skipped: filter.reason };

  const db = sql();
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
        visitor_id, session_id, path, referrer, country, region, city, device, browser, ip_hash,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term
      ) VALUES (
        ${visitorId}, ${sessionId}, ${path}, ${referrer}, ${country}, ${region}, ${city},
        ${device}, ${browser}, ${ipHash},
        ${parsed.utmSource}, ${parsed.utmMedium}, ${parsed.utmCampaign},
        ${parsed.utmContent}, ${parsed.utmTerm}
      )
    `;
  }

  await db`
    INSERT INTO visitor_presence (
      visitor_id, last_path, country, region, city, device, browser, first_seen_at, last_seen_at
    ) VALUES (
      ${visitorId}, ${path}, ${country}, ${region}, ${city}, ${device}, ${browser}, NOW(), NOW()
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

export type AnalyticsEventType = "scan" | "unlock" | "promo_redeem" | "checkout_start";

export async function recordAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  visitorId?: string | null;
  sessionId?: string | null;
  path?: string | null;
  meta?: Record<string, unknown> | null;
  country?: string | null;
  ipHash?: string | null;
}): Promise<{ ok: boolean; skipped?: string }> {
  if (!canUseVisitorAnalytics()) return { ok: false, skipped: "not_configured" };
  await ensureVisitorSchema();
  const filter = await shouldAcceptTraffic({
    path: input.path || "/",
    country: input.country,
    ipHash: input.ipHash,
  });
  if (!filter.allow) return { ok: true, skipped: filter.reason };

  const db = sql();
  const visitorId = cleanText(input.visitorId, 64);
  const sessionId = cleanText(input.sessionId, 64);
  const path = cleanText(input.path, 500);
  const country = cleanText(input.country, 8);
  const ipHash = cleanText(input.ipHash, 64);
  const meta = input.meta ? JSON.stringify(input.meta) : null;

  await db`
    INSERT INTO analytics_events (visitor_id, session_id, event_type, path, meta, country, ip_hash)
    VALUES (
      ${visitorId}, ${sessionId}, ${input.eventType}, ${path},
      ${meta}::jsonb, ${country}, ${ipHash}
    )
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
    new7d: number;
    returning7d: number;
  };
  funnel: {
    visitors: number;
    scans: number;
    unlocks: number;
    visitToScanPct: number;
    scanToUnlockPct: number;
    visitToUnlockPct: number;
  };
  countries: NamedCount[];
  pages: NamedCount[];
  referrers: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  utmSources: NamedCount[];
  utmCampaigns: NamedCount[];
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
    utmSource: string | null;
    createdAt: string;
  }[];
  settings: AnalyticsSettings;
};

function asCountRows(rows: { name: string | null; count: string | number | null }[]): NamedCount[] {
  return rows
    .map((r) => ({
      name: (r.name || "Unknown").trim() || "Unknown",
      count: Number(r.count || 0),
    }))
    .filter((r) => r.count > 0);
}

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export async function getVisitorAnalyticsSummary(
  opts: { onlineMinutes?: number } = {}
): Promise<VisitorAnalyticsSummary> {
  const onlineWindowMinutes = opts.onlineMinutes ?? 5;
  const settings = await getAnalyticsSettings();
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
      new7d: 0,
      returning7d: 0,
    },
    funnel: {
      visitors: 0,
      scans: 0,
      unlocks: 0,
      visitToScanPct: 0,
      scanToUnlockPct: 0,
      visitToUnlockPct: 0,
    },
    countries: [],
    pages: [],
    referrers: [],
    devices: [],
    browsers: [],
    utmSources: [],
    utmCampaigns: [],
    hourly: [],
    online: [],
    recent: [],
    settings,
  };

  if (!canUseVisitorAnalytics()) return empty;
  await ensureVisitorSchema();
  const db = sql();

  const [
    totalsRows,
    cohortRows,
    funnelRows,
    countryRows,
    pageRows,
    referrerRows,
    deviceRows,
    browserRows,
    utmSourceRows,
    utmCampaignRows,
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
      SELECT
        COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '7 days')::int AS new_7d,
        COUNT(*) FILTER (
          WHERE last_seen_at >= NOW() - INTERVAL '7 days'
            AND first_seen_at < NOW() - INTERVAL '7 days'
        )::int AS returning_7d
      FROM visitor_presence
    `,
    db`
      SELECT
        (SELECT COUNT(DISTINCT visitor_id)::int FROM page_views
          WHERE created_at >= NOW() - INTERVAL '30 days') AS visitors,
        (SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id, id::text))::int FROM analytics_events
          WHERE event_type = 'scan' AND created_at >= NOW() - INTERVAL '30 days') AS scans,
        (SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id, id::text))::int FROM analytics_events
          WHERE event_type IN ('unlock', 'promo_redeem')
            AND created_at >= NOW() - INTERVAL '30 days') AS unlocks
    `,
    db`
      SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1 ORDER BY count DESC LIMIT 15
    `,
    db`
      SELECT path AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY path ORDER BY count DESC LIMIT 15
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
      GROUP BY 1 ORDER BY count DESC LIMIT 15
    `,
    db`
      SELECT COALESCE(NULLIF(device, ''), 'unknown') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1 ORDER BY count DESC
    `,
    db`
      SELECT COALESCE(NULLIF(browser, ''), 'other') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1 ORDER BY count DESC
    `,
    db`
      SELECT COALESCE(NULLIF(utm_source, ''), '(none)') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days' AND utm_source IS NOT NULL AND utm_source <> ''
      GROUP BY 1 ORDER BY count DESC LIMIT 15
    `,
    db`
      SELECT COALESCE(NULLIF(utm_campaign, ''), '(none)') AS name, COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days' AND utm_campaign IS NOT NULL AND utm_campaign <> ''
      GROUP BY 1 ORDER BY count DESC LIMIT 15
    `,
    db`
      SELECT to_char(date_trunc('hour', created_at), 'YYYY-MM-DD"T"HH24:00:00"Z"') AS hour,
             COUNT(*)::int AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY 1 ORDER BY 1 ASC
    `,
    db`
      SELECT visitor_id, last_path, country, city, device, last_seen_at
      FROM visitor_presence
      WHERE last_seen_at >= NOW() - make_interval(mins => ${onlineWindowMinutes})
      ORDER BY last_seen_at DESC
      LIMIT 50
    `,
    db`
      SELECT path, country, city, device, browser, referrer, utm_source, created_at
      FROM page_views
      ORDER BY created_at DESC
      LIMIT 40
    `,
  ]);

  const t = totalsRows[0] || {};
  const c = cohortRows[0] || {};
  const f = funnelRows[0] || {};
  const visitors = Number(f.visitors || 0);
  const scans = Number(f.scans || 0);
  const unlocks = Number(f.unlocks || 0);

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
      new7d: Number(c.new_7d || 0),
      returning7d: Number(c.returning_7d || 0),
    },
    funnel: {
      visitors,
      scans,
      unlocks,
      visitToScanPct: pct(scans, visitors),
      scanToUnlockPct: pct(unlocks, scans),
      visitToUnlockPct: pct(unlocks, visitors),
    },
    countries: asCountRows(countryRows as { name: string | null; count: string | number | null }[]),
    pages: asCountRows(pageRows as { name: string | null; count: string | number | null }[]),
    referrers: asCountRows(referrerRows as { name: string | null; count: string | number | null }[]),
    devices: asCountRows(deviceRows as { name: string | null; count: string | number | null }[]),
    browsers: asCountRows(browserRows as { name: string | null; count: string | number | null }[]),
    utmSources: asCountRows(utmSourceRows as { name: string | null; count: string | number | null }[]),
    utmCampaigns: asCountRows(
      utmCampaignRows as { name: string | null; count: string | number | null }[]
    ),
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
        utm_source: string | null;
        created_at: string | Date;
      }[]
    ).map((r) => ({
      path: r.path,
      country: r.country,
      city: r.city,
      device: r.device,
      browser: r.browser,
      referrer: r.referrer,
      utmSource: r.utm_source,
      createdAt: new Date(r.created_at).toISOString(),
    })),
    settings,
  };
}

export async function buildWeeklyTrafficDigestHtml(siteUrl: string): Promise<{
  subject: string;
  html: string;
  text: string;
  summary: VisitorAnalyticsSummary;
}> {
  const summary = await getVisitorAnalyticsSummary();
  const subject = `SEOHub weekly traffic · ${summary.totals.views7d} views · ${summary.totals.unique7d} uniques`;
  const topCountries = summary.countries
    .slice(0, 5)
    .map((c) => `${c.name}: ${c.count}`)
    .join(", ");
  const topPages = summary.pages
    .slice(0, 5)
    .map((p) => `${p.name} (${p.count})`)
    .join(", ");

  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#0f172a">
  <h1 style="font-size:20px">SEOHub weekly traffic</h1>
  <p>Last 7 days on <a href="${siteUrl}">${siteUrl}</a></p>
  <ul>
    <li><strong>${summary.totals.views7d}</strong> page views</li>
    <li><strong>${summary.totals.unique7d}</strong> unique visitors (${summary.totals.new7d} new / ${summary.totals.returning7d} returning)</li>
    <li>Funnel: ${summary.funnel.visitors} visits → ${summary.funnel.scans} scans → ${summary.funnel.unlocks} unlocks</li>
    <li>Top countries: ${topCountries || "n/a"}</li>
    <li>Top pages: ${topPages || "n/a"}</li>
  </ul>
  <p><a href="${siteUrl}/admin">Open admin → Visitors</a></p>
  </body></html>`;

  const text = [
    "SEOHub weekly traffic",
    `Views (7d): ${summary.totals.views7d}`,
    `Uniques (7d): ${summary.totals.unique7d} (new ${summary.totals.new7d}, returning ${summary.totals.returning7d})`,
    `Funnel: ${summary.funnel.visitors} → ${summary.funnel.scans} → ${summary.funnel.unlocks}`,
    `Countries: ${topCountries || "n/a"}`,
    `Pages: ${topPages || "n/a"}`,
    `${siteUrl}/admin`,
  ].join("\n");

  return { subject, html, text, summary };
}

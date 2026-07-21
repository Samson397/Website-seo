import { neon } from "@neondatabase/serverless";
import { dataForSeoAuthHeader, getDataForSeoCredentials } from "@/lib/dataforseo";

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function canUseRankTracking(): boolean {
  return Boolean(getDatabaseUrl());
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureRankSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS rank_tracks (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          url TEXT NOT NULL,
          keyword TEXT NOT NULL,
          location_code INTEGER NOT NULL DEFAULT 2826,
          last_position INTEGER,
          last_ranking_url TEXT,
          history JSONB NOT NULL DEFAULT '[]'::jsonb,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          unsubscribe_token TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_checked_at TIMESTAMPTZ
        )
      `;
      await db`CREATE INDEX IF NOT EXISTS rank_tracks_active_idx ON rank_tracks (active)`;
    })();
  }
  await schemaReady;
}

function newId() {
  return `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function newToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function subscribeRankTrack(input: {
  email: string;
  url: string;
  keyword: string;
}): Promise<{ id: string; unsubscribeToken: string } | null> {
  if (!canUseRankTracking()) return null;
  await ensureRankSchema();
  const db = sql();
  const id = newId();
  const unsubscribeToken = newToken();
  await db`
    INSERT INTO rank_tracks (id, email, url, keyword, unsubscribe_token)
    VALUES (${id}, ${input.email.toLowerCase().trim()}, ${input.url}, ${input.keyword.trim()}, ${unsubscribeToken})
  `;
  return { id, unsubscribeToken };
}

export type RankTrackRow = {
  id: string;
  email: string;
  url: string;
  keyword: string;
  location_code: number;
  last_position: number | null;
  last_ranking_url: string | null;
  history: Array<{ at: string; position: number | null }>;
  unsubscribe_token: string;
};

export async function listActiveRankTracks(limit = 80): Promise<RankTrackRow[]> {
  if (!canUseRankTracking()) return [];
  await ensureRankSchema();
  const db = sql();
  const rows = await db`
    SELECT id, email, url, keyword, location_code, last_position, last_ranking_url, history, unsubscribe_token
    FROM rank_tracks
    WHERE active = TRUE
    ORDER BY updated_at ASC
    LIMIT ${limit}
  `;
  return (rows as RankTrackRow[]).map((r) => ({
    ...r,
    history: Array.isArray(r.history) ? r.history : [],
  }));
}

export async function checkKeywordPosition(
  keyword: string,
  url: string,
  locationCode = 2826
): Promise<{ position: number | null; rankingUrl: string | null }> {
  const creds = getDataForSeoCredentials();
  if (!creds) return { position: null, rankingUrl: null };

  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
    method: "POST",
    headers: {
      Authorization: dataForSeoAuthHeader(creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keyword,
        location_code: locationCode,
        language_code: "en",
        depth: 100,
      },
    ]),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) return { position: null, rankingUrl: null };
  const data = await res.json();
  const items = (data.tasks?.[0]?.result?.[0]?.items || []) as Array<{
    type?: string;
    rank_group?: number;
    rank_absolute?: number;
    url?: string;
  }>;
  for (const item of items) {
    if (item.type && item.type !== "organic") continue;
    const itemHost = (() => {
      try {
        return new URL(String(item.url || "")).hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    })();
    if (host && itemHost === host) {
      return {
        position: item.rank_group || item.rank_absolute || null,
        rankingUrl: item.url || null,
      };
    }
  }
  return { position: null, rankingUrl: null };
}

export async function updateRankTrackCheck(
  id: string,
  position: number | null,
  rankingUrl: string | null,
  history: Array<{ at: string; position: number | null }>
) {
  if (!canUseRankTracking()) return;
  await ensureRankSchema();
  const db = sql();
  await db`
    UPDATE rank_tracks
    SET last_position = ${position},
        last_ranking_url = ${rankingUrl},
        history = ${JSON.stringify(history)}::jsonb,
        last_checked_at = NOW(),
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

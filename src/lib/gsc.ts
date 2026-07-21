import { getSiteUrl } from "@/lib/site-url";
import { refreshAccessToken } from "@/lib/google-oauth";

export type GscSummary = {
  configured: boolean;
  siteUrl: string | null;
  sites: { siteUrl: string; permissionLevel?: string }[];
  totals: {
    clicks28d: number;
    impressions28d: number;
    ctr28d: number;
    position28d: number;
  };
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  daily: { date: string; clicks: number; impressions: number }[];
  error?: string;
};

function emptySummary(partial?: Partial<GscSummary>): GscSummary {
  return {
    configured: false,
    siteUrl: null,
    sites: [],
    totals: { clicks28d: 0, impressions28d: 0, ctr28d: 0, position28d: 0 },
    topQueries: [],
    topPages: [],
    daily: [],
    ...partial,
  };
}

export function getGscSiteUrl(): string {
  const override = (process.env.GSC_SITE_URL || "").trim();
  if (override) return override.endsWith("/") ? override : `${override}/`;
  const site = getSiteUrl();
  return site.endsWith("/") ? site : `${site}/`;
}

type SearchAnalyticsRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchAnalyticsResponse = {
  rows?: SearchAnalyticsRow[];
  error?: { message?: string; code?: number; status?: string };
};

async function listSites(accessToken: string): Promise<{ siteUrl: string; permissionLevel?: string }[]> {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await res.json()) as {
    siteEntry?: { siteUrl?: string; permissionLevel?: string }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Search Console sites failed (${res.status})`);
  }
  return (data.siteEntry || [])
    .filter((s) => s.siteUrl)
    .map((s) => ({ siteUrl: s.siteUrl as string, permissionLevel: s.permissionLevel }));
}

async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>
): Promise<SearchAnalyticsResponse> {
  const encoded = encodeURIComponent(siteUrl);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );
  const data = (await res.json()) as SearchAnalyticsResponse;
  if (!res.ok) {
    throw new Error(data.error?.message || `Search Console query failed (${res.status})`);
  }
  return data;
}

function pickSiteUrl(
  preferred: string,
  sites: { siteUrl: string }[]
): string | null {
  if (!sites.length) return null;
  const exact = sites.find((s) => s.siteUrl === preferred);
  if (exact) return exact.siteUrl;
  const noSlash = preferred.replace(/\/$/, "");
  const close = sites.find(
    (s) => s.siteUrl.replace(/\/$/, "") === noSlash || s.siteUrl.includes("seohub.online")
  );
  if (close) return close.siteUrl;
  return sites[0]?.siteUrl || null;
}

export async function fetchGscSummary(options?: {
  oauthRefreshToken?: string | null;
}): Promise<GscSummary> {
  if (!options?.oauthRefreshToken) {
    return emptySummary({
      siteUrl: getGscSiteUrl(),
      error:
        "Sign in with Google (Search Console readonly) so a refresh token is stored, then open this tab again.",
    });
  }

  let accessToken: string;
  try {
    const tokens = await refreshAccessToken(options.oauthRefreshToken);
    accessToken = tokens.access_token;
  } catch (err) {
    return emptySummary({
      siteUrl: getGscSiteUrl(),
      error: err instanceof Error ? err.message : "OAuth refresh failed",
    });
  }

  try {
    const sites = await listSites(accessToken);
    const preferred = getGscSiteUrl();
    const siteUrl = pickSiteUrl(preferred, sites);
    if (!siteUrl) {
      return emptySummary({
        sites,
        error:
          "No Search Console properties on this Google account. Add https://www.seohub.online/ (or a domain property) in Search Console and verify ownership.",
      });
    }

    const [totals, queries, pages, daily] = await Promise.all([
      querySearchAnalytics(accessToken, siteUrl, {
        startDate: daysAgo(28),
        endDate: daysAgo(1),
        rowLimit: 1,
      }),
      querySearchAnalytics(accessToken, siteUrl, {
        startDate: daysAgo(28),
        endDate: daysAgo(1),
        dimensions: ["query"],
        rowLimit: 15,
      }),
      querySearchAnalytics(accessToken, siteUrl, {
        startDate: daysAgo(28),
        endDate: daysAgo(1),
        dimensions: ["page"],
        rowLimit: 15,
      }),
      querySearchAnalytics(accessToken, siteUrl, {
        startDate: daysAgo(14),
        endDate: daysAgo(1),
        dimensions: ["date"],
        rowLimit: 30,
      }),
    ]);

    const totalRow = totals.rows?.[0];
    return {
      configured: true,
      siteUrl,
      sites,
      totals: {
        clicks28d: Number(totalRow?.clicks || 0),
        impressions28d: Number(totalRow?.impressions || 0),
        ctr28d: Number(totalRow?.ctr || 0),
        position28d: Number(totalRow?.position || 0),
      },
      topQueries: (queries.rows || []).map((row) => ({
        query: row.keys?.[0] || "(empty)",
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        ctr: Number(row.ctr || 0),
        position: Number(row.position || 0),
      })),
      topPages: (pages.rows || []).map((row) => ({
        page: row.keys?.[0] || "/",
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        ctr: Number(row.ctr || 0),
        position: Number(row.position || 0),
      })),
      daily: (daily.rows || []).map((row) => ({
        date: row.keys?.[0] || "",
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
      })),
    };
  } catch (err) {
    return emptySummary({
      siteUrl: getGscSiteUrl(),
      error: err instanceof Error ? err.message : "Search Console fetch failed",
    });
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

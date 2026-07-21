import { createSign, createPrivateKey } from "crypto";
import { getGoogleClientId, getGoogleClientSecret, refreshAccessToken } from "@/lib/google-oauth";

export type Ga4Summary = {
  configured: boolean;
  source: "service_account" | "oauth" | null;
  propertyId: string | null;
  totals: {
    activeUsers7d: number;
    sessions7d: number;
    screenPageViews7d: number;
    activeUsers30d: number;
    sessions30d: number;
    screenPageViews30d: number;
  };
  topPages: { path: string; views: number }[];
  topCountries: { name: string; users: number }[];
  daily: { date: string; users: number; views: number }[];
  error?: string;
};

function emptySummary(partial?: Partial<Ga4Summary>): Ga4Summary {
  return {
    configured: false,
    source: null,
    propertyId: null,
    totals: {
      activeUsers7d: 0,
      sessions7d: 0,
      screenPageViews7d: 0,
      activeUsers30d: 0,
      sessions30d: 0,
      screenPageViews30d: 0,
    },
    topPages: [],
    topCountries: [],
    daily: [],
    ...partial,
  };
}

export function getGa4PropertyId(): string {
  return (process.env.GA4_PROPERTY_ID || process.env.GOOGLE_ANALYTICS_PROPERTY_ID || "").trim();
}

export function getGa4MeasurementId(): string {
  return (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function parseGaServiceAccount(): ServiceAccount | null {
  const json =
    process.env.GA_SERVICE_ACCOUNT ||
    process.env.GOOGLE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    "";
  if (!json.trim()) return null;
  try {
    const parsed = JSON.parse(json) as {
      client_email?: string;
      private_key?: string;
      token_uri?: string;
    };
    if (parsed.client_email && parsed.private_key) {
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, "\n"),
        token_uri: parsed.token_uri,
      };
    }
  } catch {
    console.error("[ga4] Service account JSON is invalid");
  }
  return null;
}

export function isGa4DataApiConfigured(): boolean {
  return Boolean(getGa4PropertyId() && (parseGaServiceAccount() || (getGoogleClientId() && getGoogleClientSecret())));
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

async function accessTokenFromServiceAccount(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: account.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const key = createPrivateKey(account.private_key);
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = b64url(signer.sign(key));
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(account.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Service account token failed");
  }
  return data.access_token;
}

type RunReportResponse = {
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
  totals?: { metricValues?: { value?: string }[] }[];
  error?: { message?: string };
};

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>
): Promise<RunReportResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
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
  const data = (await res.json()) as RunReportResponse & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `GA4 report failed (${res.status})`);
  }
  return data;
}

function metricTotal(report: RunReportResponse, index: number): number {
  const fromTotals = Number(report.totals?.[0]?.metricValues?.[index]?.value || 0);
  if (fromTotals) return fromTotals;
  return (report.rows || []).reduce(
    (sum, row) => sum + Number(row.metricValues?.[index]?.value || 0),
    0
  );
}

export async function fetchGa4Summary(options?: {
  oauthRefreshToken?: string | null;
}): Promise<Ga4Summary> {
  const propertyId = getGa4PropertyId();
  if (!propertyId) {
    return emptySummary({
      error:
        "Set GA4_PROPERTY_ID (numeric property id from GA Admin → Property settings).",
    });
  }

  let accessToken: string | null = null;
  let source: "service_account" | "oauth" | null = null;

  const account = parseGaServiceAccount();
  if (account) {
    try {
      accessToken = await accessTokenFromServiceAccount(account);
      source = "service_account";
    } catch (err) {
      return emptySummary({
        propertyId,
        error: err instanceof Error ? err.message : "Service account auth failed",
      });
    }
  } else if (options?.oauthRefreshToken) {
    try {
      const tokens = await refreshAccessToken(options.oauthRefreshToken);
      accessToken = tokens.access_token;
      source = "oauth";
    } catch (err) {
      return emptySummary({
        propertyId,
        error: err instanceof Error ? err.message : "OAuth refresh failed",
      });
    }
  } else {
    return emptySummary({
      propertyId,
      error:
        "Add GA_SERVICE_ACCOUNT JSON, or sign in with Google (Analytics readonly) so a refresh token is stored.",
    });
  }

  if (!accessToken || !source) {
    return emptySummary({ propertyId, error: "No Google access token available." });
  }

  try {
    const [totals7, totals30, pages, countries, daily] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "14daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    return {
      configured: true,
      source,
      propertyId,
      totals: {
        activeUsers7d: metricTotal(totals7, 0),
        sessions7d: metricTotal(totals7, 1),
        screenPageViews7d: metricTotal(totals7, 2),
        activeUsers30d: metricTotal(totals30, 0),
        sessions30d: metricTotal(totals30, 1),
        screenPageViews30d: metricTotal(totals30, 2),
      },
      topPages: (pages.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || "/",
        views: Number(row.metricValues?.[0]?.value || 0),
      })),
      topCountries: (countries.rows || []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || "Unknown",
        users: Number(row.metricValues?.[0]?.value || 0),
      })),
      daily: (daily.rows || []).map((row) => {
        const raw = row.dimensionValues?.[0]?.value || "";
        const date =
          raw.length === 8
            ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
            : raw;
        return {
          date,
          users: Number(row.metricValues?.[0]?.value || 0),
          views: Number(row.metricValues?.[1]?.value || 0),
        };
      }),
    };
  } catch (err) {
    return emptySummary({
      propertyId,
      source,
      error: err instanceof Error ? err.message : "GA4 fetch failed",
    });
  }
}

import { AuditIssue, createIssue } from "@/lib/types";

export interface BacklinkEntry {
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchor?: string;
  dofollow: boolean;
  domainRank?: number;
}

export interface BacklinkProfile {
  available: boolean;
  note?: string;
  totalBacklinks?: number;
  referringDomains?: number;
  referringPages?: number;
  dofollowBacklinks?: number;
  nofollowBacklinks?: number;
  domainRank?: number;
  topBacklinks?: BacklinkEntry[];
}

interface DataForSeoCredentials {
  login: string;
  password: string;
}

function getCredentials(): DataForSeoCredentials | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (login && password) return { login, password };
  return null;
}

function authHeader(creds: DataForSeoCredentials): string {
  return `Basic ${Buffer.from(`${creds.login}:${creds.password}`).toString("base64")}`;
}

async function dataForSeoPost(
  creds: DataForSeoCredentials,
  endpoint: string,
  payload: unknown[]
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const res = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: authHeader(creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`DataForSEO API returned ${res.status}`);
  }

  return res.json();
}

export async function fetchBacklinkProfile(targetUrl: string): Promise<BacklinkProfile> {
  const creds = getCredentials();
  if (!creds) {
    return {
      available: false,
      note: "Configure DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD for backlink data. Sign up at https://dataforseo.com (pay-as-you-go, ~$0.02/request).",
    };
  }

  try {
    const hostname = new URL(targetUrl).hostname.replace(/^www\./, "");

    const [summaryData, backlinksData] = await Promise.all([
      dataForSeoPost(creds, "backlinks/summary/live", [
        { target: hostname, include_subdomains: true, backlinks_status_type: "live" },
      ]),
      dataForSeoPost(creds, "backlinks/backlinks/live", [
        {
          target: hostname,
          include_subdomains: true,
          limit: 25,
          order_by: ["rank,desc"],
          backlinks_status_type: "live",
        },
      ]),
    ]);

    const summaryResult = summaryData as {
      tasks?: { result?: Record<string, unknown>[] }[];
    };
    const summary = summaryResult.tasks?.[0]?.result?.[0] as Record<string, number> | undefined;

    const backlinksResult = backlinksData as {
      tasks?: { result?: { items?: Record<string, unknown>[] }[] }[];
    };
    const backlinkItems = (backlinksResult.tasks?.[0]?.result?.[0]?.items || []) as Record<
      string,
      unknown
    >[];

    const topBacklinks: BacklinkEntry[] = backlinkItems.slice(0, 20).map((item) => ({
      sourceUrl: String(item.url_from || item.source_url || ""),
      sourceDomain: String(item.domain_from || item.source_domain || ""),
      targetUrl: String(item.url_to || item.target_url || ""),
      anchor: item.anchor ? String(item.anchor) : undefined,
      dofollow: item.dofollow !== false && item.is_dofollow !== false,
      domainRank: typeof item.rank === "number" ? item.rank : undefined,
    }));

    return {
      available: true,
      totalBacklinks: summary?.backlinks as number | undefined,
      referringDomains: summary?.referring_domains as number | undefined,
      referringPages: summary?.referring_pages as number | undefined,
      dofollowBacklinks: summary?.backlinks_dofollow as number | undefined,
      nofollowBacklinks: summary?.backlinks_nofollow as number | undefined,
      domainRank: summary?.rank as number | undefined,
      topBacklinks,
    };
  } catch (err) {
    return {
      available: false,
      note: err instanceof Error ? err.message : "Backlink API request failed",
    };
  }
}

export function runBacklinkAudit(profile: BacklinkProfile): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (!profile.available) {
    issues.push(
      createIssue({
        category: "backlinks",
        severity: "info",
        title: "Backlink data unavailable",
        description:
          "Backlinks are links from other websites pointing to yours. They require an external index to discover — we cannot detect them by crawling your site alone.",
        recommendation: profile.note || "Configure DataForSEO API credentials.",
      })
    );
    return issues;
  }

  if (profile.totalBacklinks === 0) {
    issues.push(
      createIssue({
        category: "backlinks",
        severity: "warning",
        title: "No backlinks found",
        description:
          "Backlinks are a major Google ranking factor. New sites often have none, but established sites should actively build links.",
        currentValue: "0 referring domains",
        recommendation:
          "Create valuable content, reach out for guest posts, get listed in directories, and earn natural links.",
      })
    );
  } else if (profile.referringDomains !== undefined && profile.referringDomains < 10) {
    issues.push(
      createIssue({
        category: "backlinks",
        severity: "info",
        title: "Low referring domain count",
        description:
          "Few unique domains link to your site. Diversity of referring domains matters more than total link count.",
        currentValue: `${profile.referringDomains} referring domains, ${profile.totalBacklinks} total backlinks`,
        recommendation: "Focus on earning links from relevant, authoritative sites in your niche.",
      })
    );
  }

  if (
    profile.dofollowBacklinks !== undefined &&
    profile.nofollowBacklinks !== undefined &&
    profile.nofollowBacklinks > profile.dofollowBacklinks * 3
  ) {
    issues.push(
      createIssue({
        category: "backlinks",
        severity: "info",
        title: "Most backlinks are nofollow",
        description: "Nofollow links pass less SEO value. A healthy profile includes dofollow links from authoritative sites.",
        currentValue: `${profile.dofollowBacklinks} dofollow vs ${profile.nofollowBacklinks} nofollow`,
        recommendation: "Earn editorial dofollow links through quality content and outreach.",
      })
    );
  }

  return issues;
}

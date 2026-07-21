import { dataForSeoAuthHeader, getDataForSeoCredentials } from "@/lib/dataforseo";

export type ToxicLink = {
  sourceUrl: string;
  sourceDomain: string;
  anchor?: string;
  rank?: number;
  reasons: string[];
};

export type BacklinkOpportunity = {
  domain: string;
  sampleUrl?: string;
  competitor: string;
  reason: string;
};

export type BacklinkIntelResult = {
  available: boolean;
  yours?: {
    hostname: string;
    referringDomains: number;
    totalBacklinks: number;
    domainRank?: number;
  };
  toxic?: ToxicLink[];
  opportunities?: BacklinkOpportunity[];
  summary?: string;
  error?: string;
};

function hostnameOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function toxicReasons(item: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const domain = String(item.domain_from || "").toLowerCase();
  const anchor = String(item.anchor || "").toLowerCase();
  const rank = Number(item.rank_from ?? item.domain_from_rank ?? 0);
  const spam = Number(item.backlink_spam_score ?? item.rank ?? 0);

  if (/(porn|casino|viagra|cialis|betting|loan-online|free-traffic)/i.test(domain)) {
    reasons.push("Suspicious niche / spammy domain pattern");
  }
  if (/(porn|viagra|casino|click here|buy now|seo service)/i.test(anchor)) {
    reasons.push("Spammy anchor text");
  }
  if (rank > 0 && rank < 15) {
    reasons.push("Very low source rank");
  }
  if (spam >= 40) {
    reasons.push(`Elevated spam score (${spam})`);
  }
  if (item.is_spam === true) {
    reasons.push("Marked spam by provider");
  }
  return reasons;
}

async function dfsPost(path: string, body: unknown[]): Promise<unknown> {
  const creds = getDataForSeoCredentials();
  if (!creds) throw new Error("DataForSEO not configured");
  const res = await fetch(`https://api.dataforseo.com/v3/${path}`, {
    method: "POST",
    headers: {
      Authorization: dataForSeoAuthHeader(creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`DataForSEO ${path} failed (${res.status})`);
  return res.json();
}

async function referringDomainSet(target: string): Promise<Map<string, string>> {
  const data = (await dfsPost("backlinks/referring_domains/live", [
    {
      target,
      include_subdomains: true,
      limit: 100,
      order_by: ["rank,desc"],
      backlinks_status_type: "live",
    },
  ])) as {
    tasks?: { result?: { items?: Record<string, unknown>[] }[] }[];
  };
  const items = data.tasks?.[0]?.result?.[0]?.items || [];
  const map = new Map<string, string>();
  for (const item of items) {
    const domain = String(item.domain || item.domain_from || "").toLowerCase();
    const sample = String(item.url || item.first_url || "");
    if (domain) map.set(domain, sample);
  }
  return map;
}

export async function analyzeBacklinkIntel(input: {
  yours: string;
  competitors?: string[];
}): Promise<BacklinkIntelResult> {
  if (!getDataForSeoCredentials()) {
    return { available: false, error: "Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD." };
  }

  try {
    const yoursHost = hostnameOf(input.yours);
    const competitors = (input.competitors || []).slice(0, 3).map(hostnameOf);

    const [summaryData, backlinksData, yourDomains] = await Promise.all([
      dfsPost("backlinks/summary/live", [
        { target: yoursHost, include_subdomains: true, backlinks_status_type: "live" },
      ]),
      dfsPost("backlinks/backlinks/live", [
        {
          target: yoursHost,
          include_subdomains: true,
          limit: 50,
          order_by: ["rank,asc"],
          backlinks_status_type: "live",
        },
      ]),
      referringDomainSet(yoursHost),
    ]);

    const summary = (summaryData as { tasks?: { result?: Record<string, number>[] }[] }).tasks?.[0]
      ?.result?.[0];
    const linkItems =
      (
        backlinksData as {
          tasks?: { result?: { items?: Record<string, unknown>[] }[] }[];
        }
      ).tasks?.[0]?.result?.[0]?.items || [];

    const toxic: ToxicLink[] = [];
    for (const item of linkItems) {
      const reasons = toxicReasons(item);
      if (reasons.length === 0) continue;
      toxic.push({
        sourceUrl: String(item.url_from || ""),
        sourceDomain: String(item.domain_from || ""),
        anchor: item.anchor ? String(item.anchor) : undefined,
        rank: Number(item.rank_from ?? item.domain_from_rank ?? 0) || undefined,
        reasons,
      });
      if (toxic.length >= 20) break;
    }

    const opportunities: BacklinkOpportunity[] = [];
    for (const competitor of competitors) {
      if (!competitor || competitor === yoursHost) continue;
      const theirDomains = await referringDomainSet(competitor);
      for (const [domain, sampleUrl] of Array.from(theirDomains.entries())) {
        if (yourDomains.has(domain)) continue;
        opportunities.push({
          domain,
          sampleUrl: sampleUrl || undefined,
          competitor,
          reason: `Links to ${competitor} but not to you — outreach candidate`,
        });
        if (opportunities.length >= 40) break;
      }
      if (opportunities.length >= 40) break;
    }

    const referringDomains = summary?.referring_domains ?? yourDomains.size;
    const totalBacklinks = summary?.backlinks ?? 0;

    return {
      available: true,
      yours: {
        hostname: yoursHost,
        referringDomains,
        totalBacklinks,
        domainRank: summary?.rank,
      },
      toxic,
      opportunities: opportunities.slice(0, 30),
      summary:
        opportunities.length > 0
          ? `These ${Math.min(opportunities.length, 30)} websites link to your competitors. Try getting listed.`
          : toxic.length > 0
            ? `Found ${toxic.length} potentially toxic / low-quality link(s) to review.`
            : "Backlink profile loaded. Add competitors to find link opportunities.",
    };
  } catch (e) {
    return {
      available: false,
      error: e instanceof Error ? e.message : "Backlink intelligence failed",
    };
  }
}

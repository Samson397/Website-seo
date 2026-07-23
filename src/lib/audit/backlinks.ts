import { AuditIssue, createIssue } from "@/lib/types";

export interface BacklinkEntry {
  sourceUrl: string;
  sourceDomain: string;
  anchor?: string;
  dofollow: boolean;
}

export interface BacklinkProfile {
  available: boolean;
  totalBacklinks?: number;
  referringDomains?: number;
  dofollowBacklinks?: number;
  nofollowBacklinks?: number;
  domainRank?: number;
  topBacklinks?: BacklinkEntry[];
}

function getCredentials(): { login: string; password: string } | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (login && password) return { login, password };
  return null;
}

export async function fetchBacklinkProfile(targetUrl: string): Promise<BacklinkProfile> {
  const creds = getCredentials();
  if (!creds) return { available: false };

  try {
    const hostname = new URL(targetUrl).hostname.replace(/^www\./, "");
    const auth = `Basic ${Buffer.from(`${creds.login}:${creds.password}`).toString("base64")}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const [summaryRes, backlinksRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify([{ target: hostname, include_subdomains: true, backlinks_status_type: "live" }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/backlinks/live", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify([{
          target: hostname,
          include_subdomains: true,
          limit: 20,
          order_by: ["rank,desc"],
          backlinks_status_type: "live",
        }]),
      }),
    ]);

    clearTimeout(timeout);
    if (!summaryRes.ok) return { available: false };

    const summaryData = await summaryRes.json();
    const summary = summaryData.tasks?.[0]?.result?.[0] as Record<string, number> | undefined;

    let topBacklinks: BacklinkEntry[] = [];
    if (backlinksRes.ok) {
      const backlinksData = await backlinksRes.json();
      const items = (backlinksData.tasks?.[0]?.result?.[0]?.items || []) as Record<string, unknown>[];
      topBacklinks = items.slice(0, 20).map((item) => ({
        sourceUrl: String(item.url_from || ""),
        sourceDomain: String(item.domain_from || ""),
        anchor: item.anchor ? String(item.anchor) : undefined,
        dofollow: item.dofollow !== false,
      }));
    }

    return {
      available: true,
      totalBacklinks: summary?.backlinks,
      referringDomains: summary?.referring_domains,
      dofollowBacklinks: summary?.backlinks_dofollow,
      nofollowBacklinks: summary?.backlinks_nofollow,
      domainRank: summary?.rank,
      topBacklinks,
    };
  } catch {
    return { available: false };
  }
}

export function runBacklinkAudit(profile: BacklinkProfile): AuditIssue[] {
  if (!profile.available) return [];

  const issues: AuditIssue[] = [];

  if (profile.totalBacklinks === 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "No backlinks found",
        description: "Backlinks from other sites are a major ranking factor.",
        currentValue: "0 referring domains",
        recommendation: "Create valuable content and earn links from relevant sites.",
      })
    );
    return issues;
  }

  if (profile.referringDomains !== undefined && profile.referringDomains < 10) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Low referring domain count",
        description: "Link diversity matters more than total backlink count.",
        currentValue: `${profile.referringDomains} domains, ${profile.totalBacklinks} links`,
        recommendation: "Earn links from authoritative sites in your niche.",
      })
    );
  }

  const summed = (profile.dofollowBacklinks ?? 0) + (profile.nofollowBacklinks ?? 0);
  const total = summed > 0 ? summed : profile.totalBacklinks || 0;
  if (total > 0 && profile.dofollowBacklinks !== undefined) {
    const dofollowShare = profile.dofollowBacklinks / total;
    if (dofollowShare < 0.25 && total >= 20) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: "Low dofollow share among backlinks",
          description:
            "Most tracked backlinks are nofollow. Nofollow still drives discovery, but dofollow equity is limited.",
          currentValue: `${Math.round(dofollowShare * 100)}% dofollow (${profile.dofollowBacklinks}/${total})`,
          recommendation: "Earn editorial dofollow links from relevant publishers — not only directory/nofollow mentions.",
        })
      );
    }
  }

  const top = profile.topBacklinks || [];
  if (top.length >= 5) {
    const genericAnchors = [
      "click here",
      "read more",
      "here",
      "link",
      "website",
      "this",
      "http",
      "www",
    ];
    const spammy = top.filter((b) => {
      const a = (b.anchor || "").trim().toLowerCase();
      if (!a) return true;
      if (a.length <= 2) return true;
      if (genericAnchors.includes(a)) return true;
      if (/^https?:\/\//i.test(a) || /^www\./i.test(a)) return true;
      return false;
    });
    if (spammy.length >= Math.ceil(top.length * 0.4)) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: "Many weak or generic backlink anchors",
          description:
            "A large share of top backlinks use empty, URL-only, or generic anchor text (e.g. “click here”).",
          currentValue: `${spammy.length}/${top.length} sampled anchors look weak`,
          recommendation:
            "Pursue contextual mentions with descriptive anchors that match the page topic.",
        })
      );
    }

    const domainCounts = new Map<string, number>();
    for (const b of top) {
      const d = (b.sourceDomain || "").toLowerCase();
      if (!d) continue;
      domainCounts.set(d, (domainCounts.get(d) || 0) + 1);
    }
    const heavy = Array.from(domainCounts.entries()).filter(([, n]) => n >= 4);
    if (heavy.length > 0) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: "Backlink sample concentrated on few domains",
          description:
            "Several of the strongest sampled backlinks come from the same domains — diversity may be limited.",
          currentValue: heavy
            .slice(0, 5)
            .map(([d, n]) => `${d}×${n}`)
            .join(", "),
          recommendation: "Widen referring domains rather than stacking links from the same sites.",
        })
      );
    }
  }

  return issues;
}

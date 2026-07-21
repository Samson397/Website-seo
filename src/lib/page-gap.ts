import { USER_AGENT_BOT } from "@/lib/brand";

export type PageGapResult = {
  yours: string;
  competitors: string[];
  yourPaths: string[];
  competitorPaths: Record<string, string[]>;
  gaps: Array<{
    competitor: string;
    missingPaths: string[];
    summary: string;
  }>;
  shared: string[];
  error?: string;
};

function normalizePath(raw: string, baseHost: string): string | null {
  try {
    const u = new URL(raw, `https://${baseHost}`);
    if (u.hostname.replace(/^www\./, "") !== baseHost.replace(/^www\./, "")) return null;
    let path = u.pathname || "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    // skip assets / noise
    if (/\.(png|jpe?g|gif|svg|webp|css|js|ico|pdf|xml|txt)$/i.test(path)) return null;
    if (path.includes("/cdn-cgi/")) return null;
    return path.toLowerCase();
  } catch {
    return null;
  }
}

async function fetchSitemapPaths(siteUrl: string): Promise<string[]> {
  const base = new URL(siteUrl);
  const host = base.hostname;
  const origins = [`${base.protocol}//${base.host}`];
  const candidates = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap-index.xml",
    "/wp-sitemap.xml",
  ];
  const paths = new Set<string>();

  async function ingestSitemap(url: string, depth: number) {
    if (depth > 2) return;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT_BOT, Accept: "application/xml,text/xml,*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return;
      const xml = await res.text();
      const locs = Array.from(xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)).map((m) =>
        m[1].trim()
      );
      for (const loc of locs) {
        if (/\.xml($|\?)/i.test(loc)) {
          await ingestSitemap(loc, depth + 1);
          continue;
        }
        const path = normalizePath(loc, host);
        if (path) paths.add(path);
      }
    } catch {
      /* ignore */
    }
  }

  for (const origin of origins) {
    for (const c of candidates) {
      await ingestSitemap(`${origin}${c}`, 0);
      if (paths.size >= 40) break;
    }
    if (paths.size >= 20) break;
  }

  // Fallback: homepage internal links
  if (paths.size < 5) {
    try {
      const res = await fetch(siteUrl, {
        headers: { "User-Agent": USER_AGENT_BOT, Accept: "text/html" },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();
      const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map((m) => m[1]);
      for (const href of hrefs) {
        const path = normalizePath(href, host);
        if (path) paths.add(path);
      }
    } catch {
      /* ignore */
    }
  }

  return Array.from(paths).sort().slice(0, 200);
}

export async function analyzePageGaps(yours: string, competitors: string[]): Promise<PageGapResult> {
  const yourPaths = await fetchSitemapPaths(yours);
  const yourSet = new Set(yourPaths);
  const competitorPaths: Record<string, string[]> = {};
  const gaps: PageGapResult["gaps"] = [];
  const shared = new Set<string>();

  for (const competitor of competitors) {
    const paths = await fetchSitemapPaths(competitor);
    competitorPaths[competitor] = paths;
    const missing = paths.filter((p) => !yourSet.has(p) && p !== "/");
    for (const p of paths) {
      if (yourSet.has(p)) shared.add(p);
    }
    gaps.push({
      competitor,
      missingPaths: missing.slice(0, 30),
      summary:
        missing.length > 0
          ? `Your competitor has ${missing.length} page path(s) you don't have.`
          : "No clear sitemap/path gaps found (or competitor sitemap is thin).",
    });
  }

  return {
    yours,
    competitors,
    yourPaths,
    competitorPaths,
    gaps,
    shared: Array.from(shared).sort(),
  };
}

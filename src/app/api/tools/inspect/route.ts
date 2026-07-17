import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, safeFetch, safeFetchText, validateUrlSafe } from "@/lib/fetcher";

export const maxDuration = 30;

/** Lightweight robots.txt + sitemap + security-header inspector (no full crawl). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urlInput = body?.url;
    const mode = body?.mode === "headers" ? "headers" : "robots";

    if (!urlInput || typeof urlInput !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await validateUrlSafe(urlInput);
    const normalized = normalizeUrl(urlInput);
    const origin = new URL(normalized).origin;

    if (mode === "headers") {
      const result = await safeFetch(normalized);
      const interesting = [
        "strict-transport-security",
        "content-security-policy",
        "x-frame-options",
        "x-content-type-options",
        "referrer-policy",
        "permissions-policy",
        "feature-policy",
        "cross-origin-opener-policy",
        "cross-origin-resource-policy",
        "x-xss-protection",
      ];

      const headers: Record<string, string | null> = {};
      for (const key of interesting) {
        headers[key] = result.headers[key] || null;
      }

      return NextResponse.json({
        url: result.finalUrl,
        status: result.status,
        https: result.finalUrl.startsWith("https://"),
        headers,
        present: interesting.filter((k) => Boolean(headers[k])).length,
        total: interesting.length,
      });
    }

    const robotsTxt = await safeFetchText("/robots.txt", normalized);
    const sitemapXml = await safeFetchText("/sitemap.xml", normalized);

    const sitemapLocs: string[] = [];
    if (sitemapXml) {
      const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
      let match;
      while ((match = locRegex.exec(sitemapXml)) !== null && sitemapLocs.length < 100) {
        sitemapLocs.push(match[1].trim());
      }
    }

    const disallowAll = Boolean(robotsTxt && /disallow:\s*\/\s*$/im.test(robotsTxt));
    const sitemapDirectives =
      robotsTxt
        ?.split("\n")
        .map((l) => l.trim())
        .filter((l) => /^sitemap:/i.test(l)) ?? [];

    return NextResponse.json({
      url: normalized,
      origin,
      robots: {
        found: Boolean(robotsTxt),
        content: robotsTxt?.slice(0, 8000) ?? null,
        disallowAll,
        sitemapDirectives,
      },
      sitemap: {
        found: Boolean(sitemapXml),
        urlCount: sitemapLocs.length,
        sampleUrls: sitemapLocs.slice(0, 40),
        isIndex: Boolean(sitemapXml && /<sitemapindex/i.test(sitemapXml)),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Inspection failed";
    const status = message.includes("not allowed") || message.includes("resolve") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

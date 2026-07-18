"use client";

import { useState } from "react";
import { PageHero } from "@/components/ui/PageHero";

export default function SitemapGeneratorPage() {
  const [urls, setUrls] = useState("https://example.com/\nhttps://example.com/about\n");
  const [baseUrl, setBaseUrl] = useState("https://example.com");

  const xml = buildSitemap(urls, baseUrl);

  function download() {
    const blob = new Blob([xml], { type: "application/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sitemap.xml";
    a.click();
  }

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Generator"
        title="XML sitemap generator"
        description="Paste URLs — get a valid sitemap.xml you can upload to your site root."
      />
      <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
        <label className="block text-sm font-medium text-ink">
          Site base URL
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          URLs (one per line)
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={10}
            className="mt-1 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-mono text-sm"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white"
          >
            Download sitemap.xml
          </button>
        </div>
        <pre className="overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-xs text-teal-bright">
          {xml}
        </pre>
      </div>
    </main>
  );
}

function buildSitemap(urlsText: string, baseUrl: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines = urlsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((u) => {
      try {
        return new URL(u, baseUrl).toString();
      } catch {
        return u;
      }
    });

  const entries = lines
    .map(
      (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

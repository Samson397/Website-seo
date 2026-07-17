"use client";

import { useMemo, useState } from "react";
import { PageHero } from "@/components/ui/PageHero";

export default function RobotsGeneratorPage() {
  const [sitemapUrl, setSitemapUrl] = useState("https://example.com/sitemap.xml");
  const [disallowPaths, setDisallowPaths] = useState("/admin\n/staging");
  const [allowAll, setAllowAll] = useState(true);

  const content = useMemo(
    () => buildRobots(sitemapUrl, disallowPaths, allowAll),
    [sitemapUrl, disallowPaths, allowAll]
  );

  function download() {
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "robots.txt";
    a.click();
  }

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Generator"
        title="robots.txt generator"
        description="Build a starter robots.txt with sitemap directive and disallow rules."
      />
      <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={allowAll} onChange={(e) => setAllowAll(e.target.checked)} />
          Allow all crawlers (User-agent: *)
        </label>
        <label className="block text-sm font-medium text-ink">
          Sitemap URL
          <input
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Disallow paths (one per line)
          <textarea
            value={disallowPaths}
            onChange={(e) => setDisallowPaths(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 font-mono text-sm"
          />
        </label>
        <button
          type="button"
          onClick={download}
          className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white"
        >
          Download robots.txt
        </button>
        <pre className="overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-xs text-teal-bright">
          {content}
        </pre>
      </div>
    </main>
  );
}

function buildRobots(sitemapUrl: string, disallowText: string, allowAll: boolean): string {
  const lines = ["User-agent: *"];
  if (allowAll) lines.push("Allow: /");
  for (const path of disallowText.split("\n").map((p) => p.trim()).filter(Boolean)) {
    lines.push(`Disallow: ${path.startsWith("/") ? path : `/${path}`}`);
  }
  if (sitemapUrl.trim()) lines.push("", `Sitemap: ${sitemapUrl.trim()}`);
  return `${lines.join("\n")}\n`;
}

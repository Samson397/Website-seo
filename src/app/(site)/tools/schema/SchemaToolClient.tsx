"use client";

import { ToolShell } from "@/components/tools/ToolShell";

type SchemaResult = {
  url: string;
  count: number;
  blocks: Array<{ type: string; types: string[]; validJson: boolean; preview: string }>;
  hasOrganization: boolean;
  hasWebSite: boolean;
  hasBreadcrumb: boolean;
  hasFaq: boolean;
  hasArticle: boolean;
};

export default function SchemaToolPage() {
  return (
    <main className="min-h-screen pb-8">
      <ToolShell
        eyebrow="Free tool"
        title="JSON-LD schema inspector"
        description="Extract structured data blocks and see which schema types your page declares."
        endpoint="/api/tools/schema"
      >
        {(raw) => {
          const data = raw as SchemaResult;
          return (
            <div className="space-y-5">
              <p className="text-sm text-ink-muted">
                Found <strong className="text-ink">{data.count}</strong> JSON-LD block
                {data.count === 1 ? "" : "s"} on this page.
              </p>
              <div className="flex flex-wrap gap-2">
                <Flag on={data.hasOrganization} label="Organization" />
                <Flag on={data.hasWebSite} label="WebSite" />
                <Flag on={data.hasBreadcrumb} label="BreadcrumbList" />
                <Flag on={data.hasArticle} label="Article" />
                <Flag on={data.hasFaq} label="FAQPage" />
              </div>
              {data.blocks.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-soft px-4 py-6 text-sm text-amber-900">
                  No JSON-LD found. Consider adding Organization and WebSite schema.
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.blocks.map((block, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-ink/10 bg-white px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-semibold text-ink">{block.type}</p>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            block.validJson
                              ? "bg-teal-soft text-teal"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {block.validJson ? "Valid JSON" : "Invalid JSON"}
                        </span>
                      </div>
                      {block.types.length > 1 ? (
                        <p className="mt-1 text-xs text-ink-muted">{block.types.join(" · ")}</p>
                      ) : null}
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-ink px-3 py-2 font-mono text-[11px] text-teal-bright">
                        {block.preview}
                        {block.preview.length >= 280 ? "…" : ""}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }}
      </ToolShell>
    </main>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
        on ? "bg-teal-soft text-teal" : "bg-mist text-ink-muted"
      }`}
    >
      {on ? "✓" : "–"} {label}
    </span>
  );
}

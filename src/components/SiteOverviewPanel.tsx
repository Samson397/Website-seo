"use client";

import { useState } from "react";
import type { SiteOverview } from "@/lib/types";

interface SiteOverviewPanelProps {
  overview: SiteOverview;
}

type Tab = "links" | "domain" | "tech" | "social";

export function SiteOverviewPanel({ overview }: SiteOverviewPanelProps) {
  const [tab, setTab] = useState<Tab>("links");

  const tabs: { key: Tab; label: string }[] = [
    { key: "links", label: "Link Profile" },
    { key: "domain", label: "Domain & DNS" },
    { key: "tech", label: "Technology" },
    { key: "social", label: "Social" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 pt-5">
        <h3 className="text-lg font-bold text-slate-900">Complete Site Intelligence</h3>
        <p className="mt-1 text-sm text-slate-500">
          Domain, DNS, SSL, technology, and link profile — no API keys required
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === "links" && <LinksTab overview={overview} />}
        {tab === "domain" && <DomainTab overview={overview} />}
        {tab === "tech" && <TechTab overview={overview} />}
        {tab === "social" && <SocialTab overview={overview} />}
      </div>
    </div>
  );
}

function LinksTab({ overview }: { overview: SiteOverview }) {
  const { externalLinks, internalLinks, backlinks } = overview;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Internal Links" value={internalLinks.toString()} />
        <Stat label="External Links" value={externalLinks.total.toString()} />
        <Stat label="External Domains" value={externalLinks.uniqueDomains.toString()} />
      </div>

      {backlinks?.available && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Backlinks</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total" value={backlinks.totalBacklinks?.toLocaleString() ?? "—"} />
            <Stat label="Referring Domains" value={backlinks.referringDomains?.toLocaleString() ?? "—"} />
            <Stat label="Dofollow" value={backlinks.dofollowBacklinks?.toLocaleString() ?? "—"} />
            <Stat label="Domain Rank" value={backlinks.domainRank?.toString() ?? "—"} />
          </div>
          {backlinks.topBacklinks && backlinks.topBacklinks.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500">
                    <th className="pb-2 pr-3">Source</th>
                    <th className="pb-2 pr-3">Anchor</th>
                    <th className="pb-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {backlinks.topBacklinks.map((link, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-800">{link.sourceDomain}</td>
                      <td className="py-2 pr-3 text-slate-600">{link.anchor || "—"}</td>
                      <td className="py-2 text-xs">{link.dofollow ? "dofollow" : "nofollow"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {externalLinks.topDomains.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Top Linked Domains</h4>
          <div className="space-y-1">
            {externalLinks.topDomains.map((d) => (
              <div
                key={d.domain}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-800">{d.domain}</span>
                <span className="font-medium text-slate-500">{d.count} links</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DomainTab({ overview }: { overview: SiteOverview }) {
  const { domain, dns, ssl } = overview;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoBlock title="Domain Registration">
        <InfoRow label="Registrar" value={domain.registrar} />
        <InfoRow label="Created" value={domain.created?.split("T")[0]} />
        <InfoRow label="Expires" value={domain.expires?.split("T")[0]} />
        {domain.daysUntilExpiry !== undefined && (
          <InfoRow label="Days until expiry" value={String(domain.daysUntilExpiry)} />
        )}
        {domain.nameservers && (
          <InfoRow label="Nameservers" value={domain.nameservers.slice(0, 3).join(", ")} />
        )}
      </InfoBlock>
      <InfoBlock title="SSL Certificate">
        <InfoRow label="Issuer" value={ssl.issuer} />
        <InfoRow label="Valid until" value={ssl.validTo} />
        {ssl.daysUntilExpiry !== undefined && (
          <InfoRow label="Days until expiry" value={String(ssl.daysUntilExpiry)} />
        )}
        <InfoRow label="Protocol" value={ssl.protocol} />
      </InfoBlock>
      <InfoBlock title="DNS & Email">
        <InfoRow label="SPF" value={dns.hasSpf ? "✓ Configured" : "✗ Missing"} />
        <InfoRow label="DMARC" value={dns.hasDmarc ? "✓ Configured" : "✗ Missing"} />
        <InfoRow label="DKIM" value={dns.hasDkim ? "✓ Detected" : "✗ Not found"} />
        <InfoRow label="IPv4" value={dns.ipv4?.join(", ")} />
        <InfoRow label="IPv6" value={dns.ipv6?.length ? dns.ipv6.join(", ") : "Not configured"} />
        {dns.mxRecords && <InfoRow label="MX" value={dns.mxRecords.join("; ")} />}
      </InfoBlock>
    </div>
  );
}

function TechTab({ overview }: { overview: SiteOverview }) {
  if (overview.technologies.length === 0) {
    return <p className="text-sm text-slate-500">No technologies detected.</p>;
  }
  const grouped = overview.technologies.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t.name);
      return acc;
    },
    {} as Record<string, string[]>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(grouped).map(([category, names]) => (
        <div key={category} className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase text-slate-500">{category}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {names.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-2.5 py-0.5 text-sm text-slate-800 ring-1 ring-slate-200"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialTab({ overview }: { overview: SiteOverview }) {
  if (overview.socialProfiles.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No social media profiles found linked on this page.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {overview.socialProfiles.map((p) => (
        <a
          key={p.platform}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm transition hover:bg-slate-100"
        >
          <span className="font-medium text-slate-800">{p.platform}</span>
          <span className="truncate text-blue-600 max-w-[60%]">{p.url}</span>
        </a>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 break-all text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

import dns from "dns/promises";
import tls from "tls";
import { AuditIssue, createIssue } from "@/lib/types";
import { supportsEmailDnsChecks } from "@/lib/platform-domain";

export interface DomainInfo {
  registrar?: string;
  created?: string;
  expires?: string;
  daysUntilExpiry?: number;
  nameservers?: string[];
  status?: string[];
}

export interface DnsInfo {
  mxRecords?: string[];
  hasSpf: boolean;
  hasDmarc: boolean;
  hasDkim: boolean;
  ipv4?: string[];
  ipv6?: string[];
  nameservers?: string[];
}

export interface SslInfo {
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysUntilExpiry?: number;
  protocol?: string;
}

function getRootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return hostname;
}

export async function fetchDomainInfo(hostname: string): Promise<DomainInfo> {
  const domain = getRootDomain(hostname);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return {};

    const data = await res.json();
    const events = data.events || [];
    const registration = events.find((e: { eventAction: string }) => e.eventAction === "registration");
    const expiration = events.find((e: { eventAction: string }) => e.eventAction === "expiration");

    let daysUntilExpiry: number | undefined;
    if (expiration?.eventDate) {
      const expiry = new Date(expiration.eventDate);
      daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    return {
      registrar: data.entities?.find((e: { roles: string[] }) => e.roles?.includes("registrar"))?.vcardArray?.[1]?.[1]?.[3],
      created: registration?.eventDate,
      expires: expiration?.eventDate,
      daysUntilExpiry,
      nameservers: (data.nameservers || []).map((ns: { ldhName: string }) => ns.ldhName),
      status: data.status,
    };
  } catch {
    return {};
  }
}

export async function fetchDnsInfo(hostname: string): Promise<DnsInfo> {
  const domain = getRootDomain(hostname);
  const info: DnsInfo = { hasSpf: false, hasDmarc: false, hasDkim: false };

  try {
    info.mxRecords = (await dns.resolveMx(domain)).map((r) => `${r.exchange} (priority ${r.priority})`);
  } catch {
    // no mx
  }

  try {
    info.ipv4 = await dns.resolve4(domain);
  } catch {
    // no ipv4
  }

  try {
    info.ipv6 = await dns.resolve6(domain);
  } catch {
    // no ipv6
  }

  try {
    info.nameservers = await dns.resolveNs(domain);
  } catch {
    // no ns
  }

  try {
    const txtRecords = await dns.resolveTxt(domain);
    const flat = txtRecords.map((r) => r.join(""));
    info.hasSpf = flat.some((t) => t.toLowerCase().startsWith("v=spf1"));
  } catch {
    // no txt
  }

  try {
    const dmarc = await dns.resolveTxt(`_dmarc.${domain}`);
    info.hasDmarc = dmarc.some((r) => r.join("").toLowerCase().includes("v=dmarc1"));
  } catch {
    // no dmarc
  }

  try {
    const dkimSelectors = ["default", "google", "selector1", "selector2", "k1", "s1", "mail"];
    for (const sel of dkimSelectors) {
      try {
        const records = await dns.resolveTxt(`${sel}._domainkey.${domain}`);
        if (records.some((r) => r.join("").includes("v=DKIM1"))) {
          info.hasDkim = true;
          break;
        }
      } catch {
        // try next selector
      }
    }
  } catch {
    // no dkim
  }

  return info;
}

export function fetchSslInfo(hostname: string): Promise<SslInfo> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      443,
      hostname,
      { servername: hostname, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol() ?? undefined;
        socket.end();

        if (!cert || !cert.valid_to) {
          resolve({ protocol });
          return;
        }

        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.ceil(
          (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const issuerO = cert.issuer?.O;
        const issuerCN = cert.issuer?.CN;
        const subjectCN = cert.subject?.CN;

        resolve({
          issuer: (Array.isArray(issuerO) ? issuerO[0] : issuerO) ||
            (Array.isArray(issuerCN) ? issuerCN[0] : issuerCN),
          subject: Array.isArray(subjectCN) ? subjectCN[0] : subjectCN,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysUntilExpiry,
          protocol,
        });
      }
    );

    socket.setTimeout(10000, () => {
      socket.destroy();
      resolve({});
    });

    socket.on("error", () => resolve({}));
  });
}

export function runDomainAudit(
  hostname: string,
  domainInfo: DomainInfo,
  dnsInfo: DnsInfo,
  sslInfo: SslInfo
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (domainInfo.daysUntilExpiry !== undefined && domainInfo.daysUntilExpiry < 30) {
    issues.push(
      createIssue({
        category: "domain",
        severity: domainInfo.daysUntilExpiry < 7 ? "critical" : "warning",
        title: "Domain registration expiring soon",
        description: "If your domain expires, your website and email will stop working.",
        currentValue: `Expires in ${domainInfo.daysUntilExpiry} days (${domainInfo.expires?.split("T")[0]})`,
        recommendation: "Renew your domain registration immediately.",
      })
    );
  }

  if (sslInfo.daysUntilExpiry !== undefined && sslInfo.daysUntilExpiry < 30) {
    issues.push(
      createIssue({
        category: "domain",
        severity: sslInfo.daysUntilExpiry < 7 ? "critical" : "warning",
        title: "SSL certificate expiring soon",
        description: "An expired SSL certificate shows security warnings and breaks HTTPS.",
        currentValue: `Expires in ${sslInfo.daysUntilExpiry} days (${sslInfo.validTo})`,
        recommendation: "Renew your SSL certificate before it expires.",
      })
    );
  }

  if (supportsEmailDnsChecks(hostname) && !dnsInfo.hasSpf) {
    issues.push(
      createIssue({
        category: "domain",
        severity: "warning",
        title: "Missing SPF record",
        description: "SPF records prevent email spoofing. Without one, emails from your domain may land in spam.",
        recommendation: "Add an SPF TXT record to your DNS.",
        fixSnippet: `v=spf1 include:_spf.google.com ~all`,
      })
    );
  }

  if (supportsEmailDnsChecks(hostname) && !dnsInfo.hasDmarc) {
    issues.push(
      createIssue({
        category: "domain",
        severity: "warning",
        title: "Missing DMARC record",
        description: "DMARC protects your domain from email phishing and improves deliverability.",
        recommendation: "Add a DMARC TXT record at _dmarc.yourdomain.com.",
        fixSnippet: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`,
      })
    );
  }

  if (supportsEmailDnsChecks(hostname) && !dnsInfo.hasDkim) {
    issues.push(
      createIssue({
        category: "domain",
        severity: "info",
        title: "DKIM record not detected",
        description: "DKIM cryptographically signs emails to prove they came from your domain.",
        recommendation: "Set up DKIM with your email provider (Google, Microsoft, etc.).",
      })
    );
  }

  if (supportsEmailDnsChecks(hostname) && !dnsInfo.mxRecords?.length) {
    issues.push(
      createIssue({
        category: "domain",
        severity: "info",
        title: "No MX records found",
        description: "MX records are required to receive email at this domain.",
        currentValue: `Domain: ${getRootDomain(hostname)}`,
        recommendation: "Add MX records if you want email on this domain.",
      })
    );
  }

  if (sslInfo.protocol && !sslInfo.protocol.includes("TLSv1.3") && !sslInfo.protocol.includes("TLSv1.2")) {
    issues.push(
      createIssue({
        category: "security",
        severity: "warning",
        title: "Outdated TLS protocol",
        description: "Older TLS versions have known security vulnerabilities.",
        currentValue: sslInfo.protocol,
        recommendation: "Configure your server to use TLS 1.2 or 1.3 only.",
      })
    );
  }

  return issues;
}

export { getRootDomain };

import * as cheerio from "cheerio";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const SECURITY_HEADERS: {
  name: string;
  severity: "critical" | "warning" | "info";
  description: string;
  fixSnippet: string;
}[] = [
  {
    name: "strict-transport-security",
    severity: "warning",
    description:
      "HSTS tells browsers to always use HTTPS, preventing downgrade attacks.",
    fixSnippet:
      "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  },
  {
    name: "content-security-policy",
    severity: "info",
    description:
      "CSP helps prevent XSS attacks by controlling which resources the browser can load.",
    fixSnippet:
      "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  },
  {
    name: "x-frame-options",
    severity: "warning",
    description:
      "X-Frame-Options prevents your site from being embedded in iframes, protecting against clickjacking.",
    fixSnippet: "X-Frame-Options: SAMEORIGIN",
  },
  {
    name: "x-content-type-options",
    severity: "info",
    description:
      "Prevents browsers from MIME-sniffing responses away from the declared content type.",
    fixSnippet: "X-Content-Type-Options: nosniff",
  },
  {
    name: "referrer-policy",
    severity: "info",
    description:
      "Controls how much referrer information is sent with requests to other sites.",
    fixSnippet: "Referrer-Policy: strict-origin-when-cross-origin",
  },
];

export function runSecurityAudit(ctx: AuditContext): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const { headers, finalUrl, html } = ctx.fetchResult;
  const parsedUrl = new URL(finalUrl);

  if (parsedUrl.protocol !== "https:") {
    issues.push(
      createIssue({
        category: "security",
        severity: "critical",
        title: "Site not served over HTTPS",
        description:
          "HTTPS encrypts data between users and your server. Google also uses HTTPS as a ranking signal.",
        currentValue: `Using ${parsedUrl.protocol}//`,
        recommendation: "Install an SSL certificate and redirect all HTTP traffic to HTTPS.",
        fixSnippet: `# Apache .htaccess
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
      })
    );
  }

  for (const header of SECURITY_HEADERS) {
    if (!headers[header.name]) {
      issues.push(
        createIssue({
          category: "security",
          severity: header.severity,
          title: `Missing ${header.name} header`,
          description: header.description,
          recommendation: `Add the ${header.name} response header on your server.`,
          fixSnippet: header.fixSnippet,
        })
      );
    }
  }

  if (parsedUrl.protocol === "https:" && html) {
    const $ = cheerio.load(html);
    const mixedContent: string[] = [];

    $("[src], [href]").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("href") || "";
      if (src.startsWith("http://")) {
        mixedContent.push(src);
      }
    });

    if (mixedContent.length > 0) {
      const sample = mixedContent.slice(0, 3).join(", ");
      issues.push(
        createIssue({
          category: "security",
          severity: "critical",
          title: "Mixed content detected",
          description:
            "Loading HTTP resources on an HTTPS page is insecure and may be blocked by browsers.",
          currentValue: `${mixedContent.length} HTTP resource(s): ${sample}${mixedContent.length > 3 ? "..." : ""}`,
          recommendation: "Update all resource URLs to use HTTPS.",
        })
      );
    }
  }

  const encoding = headers["content-encoding"] || "";
  if (!encoding.includes("gzip") && !encoding.includes("br")) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "warning",
        title: "No text compression enabled",
        description:
          "Gzip or Brotli compression reduces HTML/CSS/JS size by 60–80%, significantly improving load times.",
        currentValue: encoding ? `content-encoding: ${encoding}` : "No compression header",
        recommendation: "Enable gzip or Brotli compression on your web server or CDN.",
        fixSnippet: `# Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;

# Apache
AddOutputFilterByType DEFLATE text/html text/css application/javascript`,
      })
    );
  }

  const cacheControl = headers["cache-control"] || "";
  if (!cacheControl || cacheControl.includes("no-store") || cacheControl.includes("no-cache")) {
    if (!cacheControl) {
      issues.push(
        createIssue({
          category: "performance",
          severity: "info",
          title: "Missing cache-control header",
          description:
            "Cache headers tell browsers and CDNs how long to store assets, reducing repeat load times.",
          recommendation: "Set appropriate Cache-Control headers for static assets.",
          fixSnippet: "Cache-Control: public, max-age=31536000, immutable",
        })
      );
    }
  }

  return issues;
}

/** Paid opt-in site spotlights (separate from editorial blog_posts). */
import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";
import type { AuditReport, AuditIssue } from "@/lib/types";
import { formatTen } from "@/lib/score-display";
import { verifyPaidCheckoutSession } from "@/lib/stripe-unlock-server";

const PAGE_SIZE = 30;

export interface SpotlightScores {
  seo: number;
  performance: number;
  accessibility: number;
  security: number;
  ai?: number;
}

export interface SpotlightBody {
  intro: string;
  themes: string[];
  cta: string;
}

export interface SpotlightPost {
  id: string;
  slug: string;
  hostname: string;
  url: string;
  title: string;
  excerpt: string;
  body: SpotlightBody;
  scores: SpotlightScores;
  stripeSessionId: string;
  createdAt: string;
}

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function canPersistSpotlights(): boolean {
  return Boolean(getDatabaseUrl());
}

export function spotlightPageSize(): number {
  return PAGE_SIZE;
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureBlogSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS site_spotlights (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          hostname TEXT NOT NULL,
          url TEXT NOT NULL,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          body_json JSONB NOT NULL,
          scores_json JSONB NOT NULL,
          stripe_session_id TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS site_spotlights_created_at_idx
        ON site_spotlights (created_at DESC)
      `;
      await db`
        CREATE INDEX IF NOT EXISTS site_spotlights_hostname_idx
        ON site_spotlights (hostname)
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Skip localhost, IPs, and non-public hostnames. */
export function isSpotlightHostnameAllowed(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  if (!h || h.length > 253) return false;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".test")) {
    return false;
  }
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") return false;
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
  // bare IPv6-ish
  if (h.includes(":") && !h.includes(".")) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(h)) {
    return false;
  }
  return true;
}

function sanitizeText(value: string, max: number): string {
  return value.replace(/\s+/g, " ").replace(/[<>]/g, "").trim().slice(0, max);
}

function slugFromHostname(hostname: string, shortId: string): string {
  const base = hostname
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `spotlight-${base || "site"}-${shortId}`;
}

function severityRank(severity: AuditIssue["severity"]): number {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

function pickThemes(issues: AuditIssue[], limit = 3): string[] {
  const sorted = [...issues].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  const seen = new Set<string>();
  const themes: string[] = [];
  for (const issue of sorted) {
    const title = sanitizeText(issue.title || "", 120);
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    themes.push(title);
    if (themes.length >= limit) break;
  }
  return themes;
}

function homepageUrl(url: string, hostname: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}/`;
  } catch {
    return `https://${hostname}/`;
  }
}

function rowToSpotlight(row: Record<string, unknown>): SpotlightPost {
  const bodyRaw = row.body_json;
  const scoresRaw = row.scores_json;
  const body =
    typeof bodyRaw === "string"
      ? (JSON.parse(bodyRaw) as SpotlightBody)
      : (bodyRaw as SpotlightBody);
  const scores =
    typeof scoresRaw === "string"
      ? (JSON.parse(scoresRaw) as SpotlightScores)
      : (scoresRaw as SpotlightScores);
  const created = row.created_at;
  return {
    id: String(row.id),
    slug: String(row.slug),
    hostname: String(row.hostname),
    url: String(row.url),
    title: String(row.title),
    excerpt: String(row.excerpt),
    body,
    scores,
    stripeSessionId: String(row.stripe_session_id),
    createdAt:
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
          ? created
          : new Date().toISOString(),
  };
}

/**
 * Create a public spotlight post from a paid full-scan report.
 * Idempotent on stripe_session_id.
 */
export async function createSpotlightFromReport(
  report: AuditReport,
  stripeSessionId: string
): Promise<SpotlightPost | null> {
  if (!canPersistSpotlights()) return null;
  if (!stripeSessionId.startsWith("cs_")) return null;

  const hostname = hostnameOf(report.url);
  if (!isSpotlightHostnameAllowed(hostname)) return null;

  await ensureBlogSchema();
  const db = sql();

  const existing = await db`
    SELECT id, slug, hostname, url, title, excerpt, body_json, scores_json, stripe_session_id, created_at
    FROM site_spotlights
    WHERE stripe_session_id = ${stripeSessionId}
    LIMIT 1
  `;
  if (existing[0]) return rowToSpotlight(existing[0] as Record<string, unknown>);

  const siteUrl = homepageUrl(report.url, hostname);
  const shortId = randomBytes(3).toString("hex");
  const id = randomBytes(6).toString("hex");
  const slug = slugFromHostname(hostname, shortId);
  const title = `Site spotlight: ${hostname}`;
  const scanned = report.scannedAt
    ? new Date(report.scannedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const excerpt = sanitizeText(
    `SEOHub audited ${hostname} on ${scanned}. Here’s a high-level snapshot.`,
    280
  );
  const themes = pickThemes(report.issues || []);
  const body: SpotlightBody = {
    intro: `SEOHub ran a full-site audit on ${hostname} on ${scanned}.`,
    themes,
    cta: "Want the same checkup? Run a free SEO audit on SEOHub.",
  };
  const scores: SpotlightScores = {
    seo: report.scores.seo,
    performance: report.scores.performance,
    accessibility: report.scores.accessibility,
    security: report.scores.security,
    ...(typeof report.scores.ai === "number" ? { ai: report.scores.ai } : {}),
  };

  try {
    await db`
      INSERT INTO site_spotlights (
        id, slug, hostname, url, title, excerpt, body_json, scores_json, stripe_session_id
      )
      VALUES (
        ${id},
        ${slug},
        ${hostname},
        ${siteUrl},
        ${title},
        ${excerpt},
        ${JSON.parse(JSON.stringify(body))},
        ${JSON.parse(JSON.stringify(scores))},
        ${stripeSessionId}
      )
    `;
  } catch (err) {
    // Race: another request inserted the same session
    const again = await db`
      SELECT id, slug, hostname, url, title, excerpt, body_json, scores_json, stripe_session_id, created_at
      FROM site_spotlights
      WHERE stripe_session_id = ${stripeSessionId}
      LIMIT 1
    `;
    if (again[0]) return rowToSpotlight(again[0] as Record<string, unknown>);
    throw err;
  }

  return {
    id,
    slug,
    hostname,
    url: siteUrl,
    title,
    excerpt,
    body,
    scores,
    stripeSessionId,
    createdAt: new Date().toISOString(),
  };
}

/** After a paid full scan: create spotlight only when checkout opted in. */
export async function maybeCreateSpotlightFromPaidScan(
  report: AuditReport,
  sessionId: string | undefined
): Promise<SpotlightPost | null> {
  if (!sessionId?.startsWith("cs_")) return null;
  if (!canPersistSpotlights()) return null;
  try {
    const paid = await verifyPaidCheckoutSession(sessionId);
    if (!paid.paid || !paid.spotlight) return null;
    return await createSpotlightFromReport(report, sessionId);
  } catch (err) {
    console.error(
      "[spotlight] create failed",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function getSpotlightBySlug(slug: string): Promise<SpotlightPost | null> {
  if (!canPersistSpotlights()) return null;
  if (!/^spotlight-[a-z0-9-]{1,80}$/i.test(slug)) return null;
  await ensureBlogSchema();
  const db = sql();
  const rows = await db`
    SELECT id, slug, hostname, url, title, excerpt, body_json, scores_json, stripe_session_id, created_at
    FROM site_spotlights
    WHERE slug = ${slug}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToSpotlight(rows[0] as Record<string, unknown>);
}

export async function listSpotlights(page = 1): Promise<{
  posts: SpotlightPost[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const pageSize = PAGE_SIZE;
  const safePage = Math.max(1, Math.floor(page) || 1);
  if (!canPersistSpotlights()) {
    return { posts: [], page: 1, pageSize, total: 0, totalPages: 0 };
  }
  await ensureBlogSchema();
  const db = sql();
  const countRows = await db`SELECT COUNT(*)::int AS n FROM site_spotlights`;
  const total = Number((countRows[0] as { n: number })?.n || 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const offset = (safePage - 1) * pageSize;
  const rows = await db`
    SELECT id, slug, hostname, url, title, excerpt, body_json, scores_json, stripe_session_id, created_at
    FROM site_spotlights
    ORDER BY created_at DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;
  return {
    posts: rows.map((r) => rowToSpotlight(r as Record<string, unknown>)),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export async function listSpotlightSlugsForSitemap(limit = 2000): Promise<
  { slug: string; updatedAt: string }[]
> {
  if (!canPersistSpotlights()) return [];
  await ensureBlogSchema();
  const db = sql();
  const rows = await db`
    SELECT slug, created_at
    FROM site_spotlights
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => {
    const created = (r as { created_at: Date | string }).created_at;
    return {
      slug: String((r as { slug: string }).slug),
      updatedAt:
        created instanceof Date
          ? created.toISOString()
          : typeof created === "string"
            ? created
            : new Date().toISOString(),
    };
  });
}

/** Display helper: "SEO 7.2/10 · …" */
export function formatSpotlightScoreLine(scores: SpotlightScores): string {
  const parts = [
    `SEO ${formatTen(scores.seo)}/10`,
    `Performance ${formatTen(scores.performance)}/10`,
    `Accessibility ${formatTen(scores.accessibility)}/10`,
    `Security ${formatTen(scores.security)}/10`,
  ];
  if (typeof scores.ai === "number") {
    parts.push(`AI ${formatTen(scores.ai)}/10`);
  }
  return parts.join(" · ");
}

import { neon } from "@neondatabase/serverless";
import type { BlogPost } from "@/lib/blog";
import { BLOG_POSTS } from "@/lib/blog";

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function canUseBlogDb(): boolean {
  return Boolean(getDatabaseUrl());
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
        CREATE TABLE IF NOT EXISTS blog_posts (
          slug TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          published_at DATE NOT NULL,
          category TEXT NOT NULL DEFAULT 'SEO',
          tags TEXT[] NOT NULL DEFAULT '{}',
          body JSONB NOT NULL DEFAULT '[]'::jsonb,
          published BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

function rowToPost(row: Record<string, unknown>): BlogPost & { published: boolean } {
  let body: string[] = [];
  const rawBody = row.body;
  if (Array.isArray(rawBody)) {
    body = rawBody.map(String);
  } else if (typeof rawBody === "string") {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      body = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      body = [];
    }
  }
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];
  const publishedAt =
    row.published_at instanceof Date
      ? row.published_at.toISOString().slice(0, 10)
      : String(row.published_at).slice(0, 10);

  return {
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    publishedAt,
    category: String(row.category || "SEO"),
    tags,
    body,
    published: Boolean(row.published),
  };
}

async function listDbPosts(opts?: { includeDrafts?: boolean }): Promise<(BlogPost & { published: boolean })[]> {
  if (!canUseBlogDb()) return [];
  await ensureBlogSchema();
  const db = sql();
  const rows = opts?.includeDrafts
    ? await db`SELECT * FROM blog_posts ORDER BY published_at DESC`
    : await db`SELECT * FROM blog_posts WHERE published = TRUE ORDER BY published_at DESC`;
  return rows.map((r) => rowToPost(r as Record<string, unknown>));
}

/** Public posts: static seed + published DB posts (DB wins on same slug). */
export async function listAllBlogPosts(): Promise<BlogPost[]> {
  const fromDb = await listDbPosts({ includeDrafts: false });
  const bySlug = new Map<string, BlogPost>();
  for (const p of BLOG_POSTS) bySlug.set(p.slug, p);
  for (const p of fromDb) {
    bySlug.set(p.slug, {
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      publishedAt: p.publishedAt,
      category: p.category,
      tags: p.tags,
      body: p.body,
    });
  }
  return Array.from(bySlug.values()).sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  );
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const all = await listAllBlogPosts();
  return all.find((p) => p.slug === slug);
}

export async function listAdminBlogPosts(): Promise<(BlogPost & { published: boolean; source: "db" | "seed" })[]> {
  const fromDb = await listDbPosts({ includeDrafts: true });
  const dbSlugs = new Set(fromDb.map((p) => p.slug));
  const seedOnly = BLOG_POSTS.filter((p) => !dbSlugs.has(p.slug)).map((p) => ({
    ...p,
    published: true,
    source: "seed" as const,
  }));
  const dbRows = fromDb.map((p) => ({ ...p, source: "db" as const }));
  return [...dbRows, ...seedOnly].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  );
}

export type UpsertBlogInput = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: string;
  tags?: string[];
  body: string[];
  published?: boolean;
};

export async function upsertBlogPost(
  input: UpsertBlogInput
): Promise<{ ok: true; post: BlogPost & { published: boolean } } | { ok: false; error: string }> {
  if (!canUseBlogDb()) {
    return { ok: false, error: "DATABASE_URL required to save blog posts from admin." };
  }

  const slug = input.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug.length < 3 || slug.length > 80) {
    return { ok: false, error: "Slug must be 3–80 characters (kebab-case)." };
  }
  if (!input.title.trim() || !input.summary.trim()) {
    return { ok: false, error: "Title and summary are required." };
  }
  const body = input.body.map((p) => p.trim()).filter(Boolean);
  if (body.length === 0) {
    return { ok: false, error: "Add at least one body paragraph." };
  }
  const publishedAt = input.publishedAt.trim() || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    return { ok: false, error: "publishedAt must be YYYY-MM-DD." };
  }

  await ensureBlogSchema();
  const db = sql();
  const tags = (input.tags || []).map((t) => t.trim()).filter(Boolean);
  const published = input.published !== false;
  const title = input.title.trim();
  const summary = input.summary.trim();
  const category = (input.category || "SEO").trim() || "SEO";
  const bodyJson = JSON.stringify(body);

  await db`
    INSERT INTO blog_posts (slug, title, summary, published_at, category, tags, body, published, updated_at)
    VALUES (
      ${slug},
      ${title},
      ${summary},
      ${publishedAt}::date,
      ${category},
      ${tags},
      ${bodyJson}::jsonb,
      ${published},
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      published_at = EXCLUDED.published_at,
      category = EXCLUDED.category,
      tags = EXCLUDED.tags,
      body = EXCLUDED.body,
      published = EXCLUDED.published,
      updated_at = NOW()
  `;

  const rows = await db`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
  return { ok: true, post: rowToPost(rows[0] as Record<string, unknown>) };
}

export async function setBlogPublished(
  slug: string,
  published: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canUseBlogDb()) {
    return { ok: false, error: "DATABASE_URL required." };
  }
  await ensureBlogSchema();
  const db = sql();
  const rows = await db`
    UPDATE blog_posts
    SET published = ${published}, updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING slug
  `;
  if (rows.length === 0) {
    return {
      ok: false,
      error: "Post not in database (seed posts in code can’t be unpublished here — copy into admin to manage).",
    };
  }
  return { ok: true };
}

export async function deleteBlogPost(
  slug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canUseBlogDb()) {
    return { ok: false, error: "DATABASE_URL required." };
  }
  await ensureBlogSchema();
  const db = sql();
  const rows = await db`DELETE FROM blog_posts WHERE slug = ${slug} RETURNING slug`;
  if (rows.length === 0) {
    return { ok: false, error: "Post not found in database." };
  }
  return { ok: true };
}

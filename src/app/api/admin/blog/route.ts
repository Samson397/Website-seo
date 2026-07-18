import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteBlogPost,
  listAdminBlogPosts,
  setBlogPublished,
  upsertBlogPost,
} from "@/lib/blog-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const posts = await listAdminBlogPosts();
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[admin/blog]", err);
    return NextResponse.json({ error: "Could not load blog posts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const paragraphs =
    typeof body.bodyText === "string"
      ? body.bodyText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : Array.isArray(body.body)
        ? body.body.map(String)
        : [];

  const result = await upsertBlogPost({
    slug: String(body.slug || ""),
    title: String(body.title || ""),
    summary: String(body.summary || ""),
    publishedAt: String(body.publishedAt || ""),
    category: String(body.category || "SEO"),
    tags:
      typeof body.tags === "string"
        ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : Array.isArray(body.tags)
          ? body.tags.map(String)
          : [],
    body: paragraphs,
    published: body.published !== false,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ post: result.post });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { slug?: string; published?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.slug || typeof body.published !== "boolean") {
    return NextResponse.json({ error: "slug and published are required." }, { status: 400 });
  }
  const result = await setBlogPublished(body.slug, body.published);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const slug = req.nextUrl.searchParams.get("slug") || "";
  if (!slug) {
    return NextResponse.json({ error: "slug query param required." }, { status: 400 });
  }
  const result = await deleteBlogPost(slug);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

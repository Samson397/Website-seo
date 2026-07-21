import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrlSafe, safeFetch } from "@/lib/fetcher";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { fetchRenderedHtml } from "@/lib/js-render";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const maxDuration = 90;

function snapshot(html: string) {
  const $ = cheerio.load(html || "");
  return {
    title: $("title").first().text().trim(),
    metaDescription: $('meta[name="description"]').attr("content")?.trim() || "",
    h1: $("h1").first().text().trim(),
    wordCount: $("body").text().replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length,
    scriptCount: $("script").length,
  };
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(`tool:js-render:${clientKeyFromRequest(req)}`, {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { url?: string };
    if (!body.url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    await validateUrlSafe(body.url);
    const target = normalizeUrl(body.url);

    const staticPage = await safeFetch(target);
    const rendered = await fetchRenderedHtml(target);

    return NextResponse.json({
      url: target,
      static: {
        status: staticPage.status,
        finalUrl: staticPage.finalUrl,
        ...snapshot(staticPage.html || ""),
      },
      rendered: {
        ok: rendered.rendered,
        status: rendered.statusCode,
        finalUrl: rendered.finalUrl,
        source: rendered.source,
        error: rendered.error,
        ...snapshot(rendered.html || ""),
      },
      delta: {
        titleChanged: Boolean(
          rendered.rendered &&
            snapshot(staticPage.html || "").title !== snapshot(rendered.html || "").title
        ),
        wordCountDelta:
          (rendered.rendered ? snapshot(rendered.html || "").wordCount : 0) -
          snapshot(staticPage.html || "").wordCount,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "JS render compare failed" },
      { status: 500 }
    );
  }
}

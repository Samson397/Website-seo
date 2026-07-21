import { NextRequest, NextResponse } from "next/server";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { generateArticleDraft } from "@/lib/ai-article";
import { isDeepSeekConfigured } from "@/lib/deepseek";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limited = rateLimit(`tool:article:${clientKeyFromRequest(req)}`, {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { keyword?: string; siteUrl?: string; notes?: string };
    if (!body.keyword?.trim()) {
      return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
    }
    const draft = await generateArticleDraft({
      keyword: body.keyword,
      siteUrl: body.siteUrl,
      notes: body.notes,
    });
    return NextResponse.json({
      draft,
      aiConfigured: isDeepSeekConfigured(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Article draft failed" },
      { status: 500 }
    );
  }
}

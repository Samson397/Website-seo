import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import {
  canUseVisitorAnalytics,
  hashIp,
  parseUserAgent,
  recordAnalyticsEvent,
} from "@/lib/visitor-analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  eventType: z.enum(["scan", "unlock", "promo_redeem", "checkout_start"]),
  visitorId: z.string().min(8).max(64).optional().nullable(),
  sessionId: z.string().min(8).max(64).optional().nullable(),
  path: z.string().max(500).optional().nullable(),
  meta: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    if (!canUseVisitorAnalytics()) {
      return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 200 });
    }

    const limited = rateLimit(`analytics:event:${clientKeyFromRequest(req)}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many events" }, { status: 429 });
    }

    const body = await req.json();
    const data = schema.parse(body);
    const country =
      req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || null;
    const { device } = parseUserAgent(req.headers.get("user-agent"));

    const result = await recordAnalyticsEvent({
      eventType: data.eventType,
      visitorId: data.visitorId,
      sessionId: data.sessionId,
      path: data.path,
      meta: {
        ...(data.meta || {}),
        device,
      },
      country,
      ipHash: hashIp(clientKeyFromRequest(req)),
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    console.error("[analytics/event]", err);
    return NextResponse.json({ error: "Analytics event failed" }, { status: 500 });
  }
}

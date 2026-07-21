import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import {
  canUseVisitorAnalytics,
  hashIp,
  parseUserAgent,
  recordVisit,
} from "@/lib/visitor-analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  visitorId: z.string().min(8).max(64),
  sessionId: z.string().min(8).max(64),
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).optional().nullable(),
  heartbeat: z.boolean().optional().default(false),
});

function geoFromRequest(req: NextRequest) {
  return {
    country: req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry"),
    region: req.headers.get("x-vercel-ip-country-region"),
    city: req.headers.get("x-vercel-ip-city"),
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!canUseVisitorAnalytics()) {
      return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 200 });
    }

    const limited = rateLimit(`analytics:visit:${clientKeyFromRequest(req)}`, {
      limit: 120,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many events" }, { status: 429 });
    }

    const body = await req.json();
    const data = schema.parse(body);

    // Never track admin surfaces
    if (data.path.startsWith("/admin") || data.path.startsWith("/api/")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const geo = geoFromRequest(req);
    const { device, browser } = parseUserAgent(req.headers.get("user-agent"));
    if (device === "bot") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ip = clientKeyFromRequest(req);
    await recordVisit({
      visitorId: data.visitorId,
      sessionId: data.sessionId,
      path: data.path,
      referrer: data.referrer,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      device,
      browser,
      ipHash: hashIp(ip),
      heartbeat: data.heartbeat,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    console.error("[analytics/visit]", err);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}

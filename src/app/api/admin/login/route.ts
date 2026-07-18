import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  passwordsMatch,
} from "@/lib/admin-auth";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin is not configured. Set ADMIN_SECRET (or INSIGHTS_SECRET) in Vercel env vars (min 8 chars).",
      },
      { status: 503 }
    );
  }

  const ip = clientKeyFromRequest(req);
  const limited = rateLimit(`admin:login:${ip}`, { limit: 10, windowMs: 15 * 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!passwordsMatch(String(body.password || ""))) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), adminCookieOptions());
  return res;
}

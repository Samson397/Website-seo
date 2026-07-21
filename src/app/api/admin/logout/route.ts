import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";
import { GOOGLE_RT_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const clear = { ...adminCookieOptions(0), maxAge: 0 };
  res.cookies.set(ADMIN_COOKIE, "", clear);
  res.cookies.set(GOOGLE_RT_COOKIE, "", clear);
  res.cookies.set(OAUTH_STATE_COOKIE, "", clear);
  return res;
}

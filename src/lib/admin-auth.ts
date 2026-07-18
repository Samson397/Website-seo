import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "seohub_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

/** Prefer ADMIN_SECRET; fall back to INSIGHTS_SECRET so one owner key can unlock both. */
export function getAdminSecret(): string {
  return (process.env.ADMIN_SECRET || process.env.INSIGHTS_SECRET || "").trim();
}

export function isAdminConfigured(): boolean {
  return getAdminSecret().length >= 8;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function createAdminSessionToken(secret = getAdminSecret()): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `v1:${exp}`;
  const sig = sign(payload, secret);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyAdminSessionToken(
  token: string | undefined | null,
  secret = getAdminSecret()
): boolean {
  if (!token || !secret) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [payload, sig] = raw.split(".");
    if (!payload || !sig) return false;
    const expected = sign(payload, secret);
    if (!safeEqual(sig, expected)) return false;
    const exp = Number(payload.split(":")[1]);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function adminCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function isAdminRequest(req: NextRequest): boolean {
  const secret = getAdminSecret();
  if (!isAdminConfigured()) return false;
  const fromCookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (verifyAdminSessionToken(fromCookie, secret)) return true;
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return Boolean(bearer && safeEqual(bearer, secret));
}

/** Server Components / route handlers using next/headers cookies() */
export function isAdminFromCookies(): boolean {
  if (!isAdminConfigured()) return false;
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export function passwordsMatch(input: string, secret = getAdminSecret()): boolean {
  if (!secret || !input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

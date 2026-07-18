import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";

/** HttpOnly grant so paid unlocks keep working even if Stripe re-verify flakes. */
export const UNLOCK_GRANT_COOKIE = "seohub_unlock_grant";
const GRANT_DAYS = 30;

function signingSecret(): string | null {
  const secret =
    process.env.UNLOCK_SIGNING_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.CRON_SECRET ||
    "";
  return secret.trim() || null;
}

function sign(payload: string): string {
  const secret = signingSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Mint a signed grant bound to a Checkout session id. */
export function mintUnlockGrant(sessionId: string): string | null {
  if (!sessionId.startsWith("cs_") || !signingSecret()) return null;
  const exp = Math.floor(Date.now() / 1000) + GRANT_DAYS * 24 * 60 * 60;
  const payload = `${sessionId}.${exp}`;
  const sig = sign(payload);
  if (!sig) return null;
  return `${payload}.${sig}`;
}

export function verifyUnlockGrant(
  token: string | undefined | null
): { ok: true; sessionId: string } | { ok: false } {
  if (!token || !signingSecret()) return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false };
  const [sessionId, expStr, sig] = parts;
  if (!sessionId?.startsWith("cs_") || !expStr || !sig) return { ok: false };
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return { ok: false };

  const payload = `${sessionId}.${expStr}`;
  const expected = sign(payload);
  if (!expected) return { ok: false };

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }

  return { ok: true, sessionId };
}

export function attachUnlockGrantCookie(res: NextResponse, sessionId: string): void {
  const token = mintUnlockGrant(sessionId);
  if (!token) return;
  res.cookies.set(UNLOCK_GRANT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GRANT_DAYS * 24 * 60 * 60,
  });
}

export function readUnlockGrantFromRequest(req: {
  cookies: { get: (name: string) => { value: string } | undefined };
}): string | undefined {
  return req.cookies.get(UNLOCK_GRANT_COOKIE)?.value;
}

import { createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv, createHash } from "crypto";
import { getSiteUrl } from "@/lib/site-url";

export const GOOGLE_RT_COOKIE = "seohub_google_rt";
export const OAUTH_STATE_COOKIE = "seohub_oauth_state";

const ANALYTICS_READONLY = "https://www.googleapis.com/auth/analytics.readonly";
const WEBMASTERS_READONLY = "https://www.googleapis.com/auth/webmasters.readonly";

export function getGoogleClientId(): string {
  return (process.env.GOOGLE_CLIENT_ID || "").trim();
}

export function getGoogleClientSecret(): string {
  return (process.env.GOOGLE_CLIENT_SECRET || "").trim();
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

/** Comma/space-separated allowlist. Empty = Google sign-in disabled even if client is set. */
export function getGoogleAdminEmails(): string[] {
  const raw = (process.env.GOOGLE_ADMIN_EMAILS || "").trim();
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isGoogleAdminEmail(email: string): boolean {
  const allow = getGoogleAdminEmails();
  if (allow.length === 0) return false;
  return allow.includes(email.trim().toLowerCase());
}

export function getGoogleRedirectUri(): string {
  const override = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (override) return override.replace(/\/$/, "");
  // Prefer registered web-client origin (homepage); middleware rewrites ?code to the API callback.
  const site = getSiteUrl();
  if (site.includes("seohub.online")) return site;
  return `${site}/api/auth/google/callback`;
}

export function googleOAuthScopes(): string {
  return ["openid", "email", "profile", ANALYTICS_READONLY, WEBMASTERS_READONLY].join(" ");
}

function signState(nonce: string): string {
  const secret = getGoogleClientSecret() || "seohub";
  const sig = createHmac("sha256", secret).update(nonce).digest("hex");
  return `${nonce}.${sig}`;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function createOAuthState(): string {
  return signState(randomBytes(16).toString("hex"));
}

export function verifyOAuthState(state: string | null | undefined, cookieValue: string | null | undefined): boolean {
  if (!state || !cookieValue || state !== cookieValue) return false;
  const [nonce, sig] = state.split(".");
  if (!nonce || !sig) return false;
  const expected = signState(nonce);
  const [, expectedSig] = expected.split(".");
  return Boolean(expectedSig && safeEqual(sig, expectedSig));
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: googleOAuthScopes(),
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Token exchange failed");
  }
  return data;
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await res.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Token refresh failed");
  }
  return data;
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string; verified_email?: boolean };
  if (!data.email || data.verified_email === false) return null;
  return data.email.trim().toLowerCase();
}

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(`seohub-google-rt:${secret}`).digest();
}

/** Encrypt refresh token for httpOnly cookie storage. */
export function sealRefreshToken(refreshToken: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function openRefreshToken(sealed: string, secret: string): string | null {
  try {
    const buf = Buffer.from(sealed, "base64url");
    if (buf.length < 28) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const key = deriveKey(secret);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

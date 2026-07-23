import dns from "dns/promises";
import { URL } from "url";

const FETCH_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const USER_AGENT =
  "SEOHub/1.0 (+https://github.com/Samson397/Website-seo)";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe80")) return true;
    return false;
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) throw new Error("URL is required");

  // Allow plain domains: example.com, www.example.com, example.com/about
  url = url.replace(/^<|>$/g, "").replace(/^https?:\/\//i, "");
  url = url.replace(/\/+$/, "") || url;

  if (!url || /\s/.test(url)) {
    throw new Error("Enter a website address like example.com");
  }

  try {
    return new URL(`https://${url}`).href;
  } catch {
    throw new Error("Enter a website address like example.com");
  }
}

export async function validateUrlSafe(urlString: string): Promise<URL> {
  const url = new URL(normalizeUrl(urlString));

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Local and internal URLs are not allowed");
  }

  if (isPrivateIp(hostname)) {
    throw new Error("Private IP addresses are not allowed");
  }

  try {
    const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);
    const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[]);
    const all = [...addresses, ...addresses6];

    if (all.length === 0) {
      throw new Error("Could not resolve hostname");
    }

    for (const addr of all) {
      if (isPrivateIp(addr)) {
        throw new Error("URL resolves to a private IP address");
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private")) throw err;
    throw new Error("Could not resolve hostname");
  }

  return url;
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

export interface SafeFetchResult {
  url: string;
  finalUrl: string;
  html: string;
  headers: Record<string, string>;
  status: number;
  responseTimeMs?: number;
  htmlSizeBytes?: number;
}

export async function safeFetch(urlString: string): Promise<SafeFetchResult> {
  const url = await validateUrlSafe(urlString);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    const response = await fetch(url.href, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const finalUrl = response.url || url.href;
    const finalParsed = new URL(finalUrl);
    const finalHost = finalParsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (isPrivateIp(finalHost) || BLOCKED_HOSTNAMES.has(finalHost)) {
      throw new Error("Redirect to internal URL blocked");
    }

    const contentType = response.headers.get("content-type") || "";
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BODY_BYTES) {
      throw new Error("Response body too large");
    }

    let html = "";
    const isTextBody =
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml") ||
      contentType.startsWith("text/") ||
      contentType.includes("xml") ||
      contentType.includes("json") ||
      contentType === "";

    if (isTextBody) {
      html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    }

    return {
      url: url.href,
      finalUrl,
      html,
      headers: normalizeHeaders(response.headers),
      status: response.status,
      responseTimeMs: Date.now() - startTime,
      htmlSizeBytes: buffer.byteLength,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function safeHead(
  urlString: string,
  opts?: { redirect?: RequestRedirect }
): Promise<{ status: number; finalUrl: string; ok: boolean }> {
  const url = await validateUrlSafe(urlString);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const redirect = opts?.redirect ?? "follow";

  try {
    const response = await fetch(url.href, {
      method: "HEAD",
      signal: controller.signal,
      redirect,
      headers: { "User-Agent": USER_AGENT },
    });

    const finalUrl = response.url || url.href;
    if (redirect === "follow") {
      const finalParsed = new URL(finalUrl);
      const finalHost = finalParsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
      if (isPrivateIp(finalHost) || BLOCKED_HOSTNAMES.has(finalHost)) {
        throw new Error("Redirect to internal URL blocked");
      }
    }

    return {
      status: response.status,
      finalUrl,
      ok: response.ok,
    };
  } catch {
    if (redirect === "manual") {
      // HEAD may fail on some hosts; try GET without following.
      try {
        const response = await fetch(url.href, {
          method: "GET",
          signal: controller.signal,
          redirect: "manual",
          headers: { "User-Agent": USER_AGENT },
        });
        return {
          status: response.status,
          finalUrl: url.href,
          ok: response.ok,
        };
      } catch {
        return { status: 0, finalUrl: url.href, ok: false };
      }
    }
    try {
      const response = await fetch(url.href, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT },
      });
      return {
        status: response.status,
        finalUrl: response.url || url.href,
        ok: response.ok,
      };
    } catch {
      return { status: 0, finalUrl: url.href, ok: false };
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function safeFetchText(path: string, baseUrl: string): Promise<string | null> {
  try {
    const resolved = new URL(path, baseUrl).href;
    const result = await safeFetch(resolved);
    if (result.status >= 400) return null;
    return result.html || null;
  } catch {
    return null;
  }
}

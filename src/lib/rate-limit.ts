/**
 * Simple in-memory rate limiter for serverless.
 * Best-effort across warm instances — enough to blunt casual abuse.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < opts.windowMs);

  if (bucket.timestamps.length >= opts.limit) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((opts.windowMs - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  // Prevent unbounded growth
  if (buckets.size > 5000) {
    const keys = Array.from(buckets.keys()).slice(0, 1000);
    for (const k of keys) buckets.delete(k);
  }

  return {
    ok: true,
    remaining: Math.max(0, opts.limit - bucket.timestamps.length),
    retryAfterSec: 0,
  };
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip;
}

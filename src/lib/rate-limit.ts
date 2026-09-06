interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let rateLimitEventCount = 0;

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Simple in-memory fixed-window rate limiter, namespaced by `bucket` (e.g.
 * "auth:login") and `key` (e.g. IP address or user id). Sufficient for a
 * single-process deployment; swap for a shared store (Redis) to rate-limit
 * across multiple instances.
 */
export function rateLimit(bucket: string, key: string, limit: number, windowMs: number): RateLimitResult {
  const id = `${bucket}:${key}`;
  const now = Date.now();
  const current = buckets.get(id);

  if (!current || current.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    rateLimitEventCount += 1;
    return { limited: true, remaining: 0, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  return { limited: false, remaining: limit - current.count, retryAfterSeconds: 0 };
}

/** Total number of requests rejected by `rateLimit` since process start — surfaced on the security dashboard. */
export function getRateLimitEventCount(): number {
  return rateLimitEventCount;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

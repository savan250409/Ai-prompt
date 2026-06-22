import "server-only";

/**
 * Fixed-window in-memory rate limiter (§10). Per-process — fine as a guardrail
 * on generation. TODO(integration): swap for a shared store (Redis/Upstash) in
 * a multi-instance deployment.
 */
const g = globalThis as unknown as {
  __rateBuckets?: Map<string, { count: number; resetAt: number }>;
};
const buckets = g.__rateBuckets ?? (g.__rateBuckets = new Map());

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

// Fixed-window rate limiter.
//
// This in-memory implementation is per-instance — fine for a single server or
// low-traffic deploy. For multi-instance production, swap the store for Upstash
// Ratelimit or Vercel KV (see docs/SECURITY.md "Rate limits"); the call sites
// do not change.

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const w = windows.get(key);

  if (!w || now >= w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (w.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((w.resetAt - now) / 1000) };
  }
  w.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Occasionally drop expired windows so the map does not grow unbounded.
export function sweepRateLimit(): void {
  const now = Date.now();
  windows.forEach((w, key) => {
    if (now >= w.resetAt) windows.delete(key);
  });
}

/**
 * Rate limiting.
 *
 * The store is pluggable on purpose. The default is in-memory, which is
 * genuinely useful — it protects a single-instance or self-hosted deployment and
 * makes local abuse obvious — but it is NOT sufficient on serverless, where each
 * cold instance keeps its own counters and an attacker distributed across
 * instances gets N× the budget.
 *
 * To harden for production, implement `RateLimitStore` against Upstash Redis and
 * pass it to `createRateLimiter`. Nothing else has to change; see the bottom of
 * this file for the exact shape.
 */

export interface RateLimitStore {
  /** Increments the counter for `key` and returns the new count plus its window reset time. */
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window counter held in module scope.
 *
 * Fixed rather than sliding window: a sliding log needs per-request timestamps,
 * and for a login endpoint the extra precision does not justify the memory. The
 * tradeoff is that an attacker can burst 2× the limit across a window boundary,
 * which is acceptable at these thresholds.
 */
class MemoryStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>();
  private lastSweep = 0;

  async hit(key: string, windowMs: number) {
    const now = Date.now();
    this.sweep(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, fresh);
      return fresh;
    }

    existing.count += 1;
    return existing;
  }

  /**
   * Drops expired buckets. Without this the map grows unbounded — one entry per
   * distinct IP, forever, which is a slow memory leak an attacker can drive.
   * Swept at most once a minute so a burst of requests does not each pay for it.
   */
  private sweep(now: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

// Module scope survives between requests within one instance; that is the whole
// mechanism. `globalThis` keeps it alive across hot reloads in development.
const store: RateLimitStore = globalThis.__sihRateStore ?? new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalThis.__sihRateStore = store;

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. For the Retry-After header. */
  retryAfter: number;
}

export function createRateLimiter({
  limit,
  windowMs,
  prefix,
  backend = store,
}: {
  limit: number;
  windowMs: number;
  prefix: string;
  backend?: RateLimitStore;
}) {
  return async function check(identifier: string): Promise<RateLimitResult> {
    const { count, resetAt } = await backend.hit(`${prefix}:${identifier}`, windowMs);
    return {
      ok: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
    };
  };
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is client-controllable unless a trusted proxy overwrites it.
 * On Vercel and Cloudflare it is set by the platform, so the leftmost entry is
 * the real client. Behind an untrusted proxy this is spoofable — which is why
 * the login limiter also keys on the submitted email, so spoofing the IP still
 * does not grant unlimited attempts against one account.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

/** Standard 429 with the headers clients and crawlers expect. */
export function tooManyRequests(result: RateLimitResult, message: string) {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'RateLimit-Limit': String(result.limit),
        'RateLimit-Remaining': '0',
        'RateLimit-Reset': String(result.retryAfter),
      },
    },
  );
}

declare global {
  var __sihRateStore: RateLimitStore | undefined;
}

/*
 * Upstash Redis swap, for reference:
 *
 *   import { Redis } from '@upstash/redis';
 *   const redis = Redis.fromEnv();
 *
 *   const redisStore: RateLimitStore = {
 *     async hit(key, windowMs) {
 *       const count = await redis.incr(key);
 *       if (count === 1) await redis.pexpire(key, windowMs);
 *       const ttl = await redis.pttl(key);
 *       return { count, resetAt: Date.now() + Math.max(ttl, 0) };
 *     },
 *   };
 *
 *   export const loginLimiter = createRateLimiter({ ..., backend: redisStore });
 */

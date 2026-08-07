import { NextResponse } from 'next/server';
import { RATE_LIMIT_CONFIG } from './rateLimitConfig';
import { normalizeEmail } from './auth';

export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

interface Bucket {
  count: number;
  resetAt: number;
}

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

  private sweep(now: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

const store: RateLimitStore = globalThis.__sihRateStore ?? new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalThis.__sihRateStore = store;

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
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

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function tooManyRequests(result: RateLimitResult, message: string) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'RateLimit-Limit': String(result.limit),
        'RateLimit-Remaining': '0',
        'RateLimit-Reset': String(result.retryAfter),
      },
    }
  );
}

// ==========================================
// Authentication Failure Backoff Tracking
// ==========================================

interface FailureRecord {
  failures: number;
  lastAttempt: number;
}

class FailureTracker {
  private records = new Map<string, FailureRecord>();
  private lastSweep = 0;

  get(key: string): FailureRecord {
    const now = Date.now();
    this.sweep(now);
    const existing = this.records.get(key);
    if (!existing) {
      return { failures: 0, lastAttempt: 0 };
    }
    return existing;
  }

  recordFailure(key: string) {
    const now = Date.now();
    this.sweep(now);
    const existing = this.records.get(key) || { failures: 0, lastAttempt: 0 };
    existing.failures += 1;
    existing.lastAttempt = now;
    this.records.set(key, existing);
  }

  reset(key: string) {
    this.records.delete(key);
  }

  private sweep(now: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    const maxAge = RATE_LIMIT_CONFIG.auth.maxBackoffMs * 2;
    for (const [key, record] of this.records) {
      if (now - record.lastAttempt > maxAge) {
        this.records.delete(key);
      }
    }
  }
}

const failureTracker: FailureTracker = globalThis.__sihFailureTracker ?? new FailureTracker();
if (process.env.NODE_ENV !== 'production') globalThis.__sihFailureTracker = failureTracker;

/**
 * Calculates exponential backoff lockout details if the user has too many consecutive failures.
 * Returns { ok: false, retryAfter: number } if locked out, or { ok: true } if allowed.
 */
function getBackoffStatus(key: string, threshold: number): { ok: boolean; retryAfter: number } {
  const record = failureTracker.get(key);
  if (record.failures < threshold) {
    return { ok: true, retryAfter: 0 };
  }

  const excess = record.failures - threshold + 1;
  const backoffMs = Math.min(
    RATE_LIMIT_CONFIG.auth.baseBackoffMs * Math.pow(RATE_LIMIT_CONFIG.auth.backoffMultiplier, excess),
    RATE_LIMIT_CONFIG.auth.maxBackoffMs
  );

  const timePassed = Date.now() - record.lastAttempt;
  const remainingMs = backoffMs - timePassed;

  if (remainingMs > 0) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil(remainingMs / 1000)) };
  }

  return { ok: true, retryAfter: 0 };
}

// IP-based burst limiter for auth endpoints (e.g. login, signup)
const authIpLimiter = createRateLimiter({
  limit: RATE_LIMIT_CONFIG.auth.ipLimit,
  windowMs: RATE_LIMIT_CONFIG.auth.ipWindowMs,
  prefix: 'auth:ip',
});

export async function checkAuthRateLimit(request: Request, email?: string): Promise<NextResponse | null> {
  const ip = clientIp(request);

  // 1. IP burst limit check (prevent high frequency flooding)
  const ipBurstCheck = await authIpLimiter(ip);
  if (!ipBurstCheck.ok) {
    return tooManyRequests(ipBurstCheck, 'Too many authentication attempts. Please wait a moment and try again.');
  }

  // 2. IP-based consecutive failure backoff
  const ipBackoff = getBackoffStatus(`ip:${ip}`, RATE_LIMIT_CONFIG.auth.maxIpFailures);
  if (!ipBackoff.ok) {
    return tooManyRequests(
      { ok: false, limit: RATE_LIMIT_CONFIG.auth.maxIpFailures, remaining: 0, retryAfter: ipBackoff.retryAfter },
      'Too many failed attempts from this connection. Please try again later.'
    );
  }

  // 3. Account/email-based consecutive failure backoff
  if (email) {
    const cleanEmail = normalizeEmail(email);
    const acctBackoff = getBackoffStatus(`acct:${cleanEmail}`, RATE_LIMIT_CONFIG.auth.maxAccountFailures);
    if (!acctBackoff.ok) {
      return tooManyRequests(
        { ok: false, limit: RATE_LIMIT_CONFIG.auth.maxAccountFailures, remaining: 0, retryAfter: acctBackoff.retryAfter },
        'This account has had too many failed sign-in attempts. Please try again later.'
      );
    }
  }

  return null;
}

export function recordAuthFailure(request: Request, email?: string) {
  const ip = clientIp(request);
  failureTracker.recordFailure(`ip:${ip}`);
  if (email) {
    failureTracker.recordFailure(`acct:${normalizeEmail(email)}`);
  }
}

export function recordAuthSuccess(request: Request, email?: string) {
  const ip = clientIp(request);
  failureTracker.reset(`ip:${ip}`);
  if (email) {
    failureTracker.reset(`acct:${normalizeEmail(email)}`);
  }
}

// ==========================================
// Public & Authenticated Endpoints Limiting
// ==========================================

const publicLimiter = createRateLimiter({
  limit: RATE_LIMIT_CONFIG.public.limit,
  windowMs: RATE_LIMIT_CONFIG.public.windowMs,
  prefix: 'pub:ip',
});

const userLimiter = createRateLimiter({
  limit: RATE_LIMIT_CONFIG.authenticated.limit,
  windowMs: RATE_LIMIT_CONFIG.authenticated.windowMs,
  prefix: 'user',
});

export async function checkPublicRateLimit(request: Request): Promise<NextResponse | null> {
  const ip = clientIp(request);
  const result = await publicLimiter(ip);
  if (!result.ok) {
    return tooManyRequests(result, 'Too many requests. Please wait a moment and try again.');
  }
  return null;
}

export async function checkUserRateLimit(request: Request, userId: string): Promise<NextResponse | null> {
  const result = await userLimiter(userId);
  if (!result.ok) {
    return tooManyRequests(result, 'Too many requests on your account. Please wait a moment and try again.');
  }
  return null;
}

declare global {
  var __sihRateStore: RateLimitStore | undefined;
  var __sihFailureTracker: FailureTracker | undefined;
}

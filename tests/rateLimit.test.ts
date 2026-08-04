import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, clientIp, tooManyRequests } from '../src/lib/rateLimit';

/**
 * Uses Node's built-in test runner via tsx — no Jest, no Vitest, no new
 * dependencies. Run with `npm test`.
 */

describe('createRateLimiter', () => {
  test('allows requests up to the limit, then blocks', async () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000, prefix: 'test:allow' });

    assert.equal((await check('a')).ok, true, '1st should pass');
    assert.equal((await check('a')).ok, true, '2nd should pass');
    assert.equal((await check('a')).ok, true, '3rd should pass');
    assert.equal((await check('a')).ok, false, '4th must be blocked');
  });

  test('reports remaining budget accurately', async () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000, prefix: 'test:remaining' });

    assert.equal((await check('b')).remaining, 2);
    assert.equal((await check('b')).remaining, 1);
    assert.equal((await check('b')).remaining, 0);
    // Must not go negative — it is sent to clients as a header.
    assert.equal((await check('b')).remaining, 0);
  });

  test('tracks identifiers independently', async () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000, prefix: 'test:isolate' });

    assert.equal((await check('user-1')).ok, true);
    assert.equal((await check('user-1')).ok, false, 'user-1 is now over budget');
    assert.equal((await check('user-2')).ok, true, 'user-2 must be unaffected');
  });

  test('prefixes prevent collisions between limiters', async () => {
    const login = createRateLimiter({ limit: 1, windowMs: 60_000, prefix: 'test:login' });
    const signup = createRateLimiter({ limit: 1, windowMs: 60_000, prefix: 'test:signup' });

    assert.equal((await login('same-key')).ok, true);
    assert.equal((await login('same-key')).ok, false);
    // Same identifier, different limiter — must have its own budget.
    assert.equal((await signup('same-key')).ok, true);
  });

  test('window expiry resets the counter', async () => {
    // 20ms window so the test does not have to wait.
    const check = createRateLimiter({ limit: 1, windowMs: 20, prefix: 'test:expiry' });

    assert.equal((await check('c')).ok, true);
    assert.equal((await check('c')).ok, false, 'blocked inside the window');

    await new Promise((r) => setTimeout(r, 30));
    assert.equal((await check('c')).ok, true, 'allowed again after the window elapsed');
  });

  test('retryAfter is always a positive whole number of seconds', async () => {
    const check = createRateLimiter({ limit: 1, windowMs: 5_000, prefix: 'test:retry' });
    await check('d');
    const blocked = await check('d');

    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfter >= 1, 'Retry-After must never be 0 or negative');
    assert.equal(Number.isInteger(blocked.retryAfter), true, 'header value must be an integer');
    assert.ok(blocked.retryAfter <= 5);
  });
});

describe('clientIp', () => {
  test('takes the leftmost x-forwarded-for entry', () => {
    const req = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.9, 70.41.3.18, 150.172.238.178' },
    });
    assert.equal(clientIp(req), '203.0.113.9');
  });

  test('trims whitespace around the entry', () => {
    const req = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '  203.0.113.9  , 70.41.3.18' },
    });
    assert.equal(clientIp(req), '203.0.113.9');
  });

  test('falls back to cf-connecting-ip', () => {
    const req = new Request('https://example.test', {
      headers: { 'cf-connecting-ip': '198.51.100.4' },
    });
    assert.equal(clientIp(req), '198.51.100.4');
  });

  test('returns a stable sentinel when no header is present', () => {
    // Must not return undefined: the value becomes part of a cache key.
    assert.equal(clientIp(new Request('https://example.test')), 'unknown');
  });
});

describe('tooManyRequests', () => {
  test('returns 429 with the headers clients rely on', async () => {
    const res = tooManyRequests(
      { ok: false, limit: 5, remaining: 0, retryAfter: 42 },
      'Slow down.',
    );

    assert.equal(res.status, 429);
    assert.equal(res.headers.get('Retry-After'), '42');
    assert.equal(res.headers.get('RateLimit-Limit'), '5');
    assert.equal(res.headers.get('RateLimit-Remaining'), '0');
    assert.deepEqual(await res.json(), { error: 'Slow down.' });
  });
});

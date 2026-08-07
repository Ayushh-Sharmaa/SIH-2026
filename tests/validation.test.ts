import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseQuery,
  profileLookupQuerySchema,
  studentSearchQuerySchema,
  dashboardQuerySchema,
  loginSchema,
  onboardingRoleSchema,
} from '../src/lib/validation';

/**
 * These cover the boundary the API routes actually sit behind. The rule under
 * test is "reject, don't sanitise": a value that does not match the schema must
 * produce `success: false`, not a trimmed or coerced value that still reaches
 * Prisma.
 */

const BASE = 'https://example.test/api/x';

describe('parseQuery', () => {
  test('absent params are undefined rather than null', () => {
    const parsed = parseQuery(BASE, profileLookupQuerySchema);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data?.userId, undefined);
  });

  test('empty-string params are dropped, not treated as a value', () => {
    // `?userId=` would otherwise fail .min(1) and 400 a legitimate request.
    const parsed = parseQuery(`${BASE}?userId=`, profileLookupQuerySchema);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data?.userId, undefined);
  });

  test('accepts a well-formed record id', () => {
    const parsed = parseQuery(`${BASE}?userId=clx1a2b3c4d5e6f7g8h9`, profileLookupQuerySchema);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data?.userId, 'clx1a2b3c4d5e6f7g8h9');
  });

  test('rejects path-traversal and injection shapes in an id', () => {
    for (const bad of ['../../etc/passwd', 'a/b', "x' OR 1=1--", 'a b', '<script>']) {
      const parsed = parseQuery(`${BASE}?userId=${encodeURIComponent(bad)}`, profileLookupQuerySchema);
      assert.equal(parsed.success, false, `must reject ${bad}`);
    }
  });

  test('rejects an over-long filter instead of truncating it', () => {
    const parsed = parseQuery(
      `${BASE}?skill=${'a'.repeat(5000)}`,
      studentSearchQuerySchema
    );
    assert.equal(parsed.success, false);
  });

  test('rejects an unknown role rather than falling through', () => {
    assert.equal(parseQuery(`${BASE}?role=ADMIN`, dashboardQuerySchema).success, false);
    assert.equal(parseQuery(`${BASE}?role=MENTOR`, dashboardQuerySchema).success, true);
  });
});

describe('body schemas reject rather than coerce', () => {
  test('login requires a plausible email and a minimum-length password', () => {
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: 'short' }).success, false);
    assert.equal(loginSchema.safeParse({ email: 'not-an-email', password: 'longenough1' }).success, false);
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: 'longenough1' }).success, true);
  });

  test('login rejects non-string types instead of stringifying them', () => {
    assert.equal(loginSchema.safeParse({ email: { $ne: null }, password: 'longenough1' }).success, false);
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: 12345678 }).success, false);
  });

  test('email is normalised to lowercase so lookups agree with storage', () => {
    const parsed = loginSchema.safeParse({ email: '  A@B.CO  ', password: 'longenough1' });
    assert.equal(parsed.success, true);
    assert.equal(parsed.data?.email, 'a@b.co');
  });

  test('onboarding role is a closed set', () => {
    assert.equal(onboardingRoleSchema.safeParse({ role: 'ADMIN' }).success, false);
    assert.equal(onboardingRoleSchema.safeParse({ role: 'STUDENT' }).success, true);
  });

  test('registration key is length-capped', () => {
    const parsed = onboardingRoleSchema.safeParse({
      role: 'MENTOR',
      registrationKey: 'k'.repeat(500),
    });
    assert.equal(parsed.success, false);
  });
});

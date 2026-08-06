import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMentorMasterKey, matchesMentorMasterKey } from '../src/lib/mentorKey';

/**
 * The mentor master key grants MENTOR without a single-use database key, so the
 * failure mode these tests guard is privilege escalation, not a broken feature.
 *
 * The literal below is the value that was hardcoded in the route handlers and
 * committed (f100068, bffff8c). It is reproduced here for the sole purpose of
 * asserting that it is refused; it must never become a usable credential again.
 */
const BURNED = 'GLB-MENTOR-MASTER-2026-SECURE';
const VALID = 'ZmFrZS1tYXN0ZXIta2V5LWZvci10ZXN0cy1vbmx5';

let saved: string | undefined;

beforeEach(() => {
  saved = process.env.GLB_MENTOR_MASTER_KEY;
});

afterEach(() => {
  if (saved === undefined) delete process.env.GLB_MENTOR_MASTER_KEY;
  else process.env.GLB_MENTOR_MASTER_KEY = saved;
});

describe('resolveMentorMasterKey', () => {
  test('returns null when unset — no fallback to the burned literal', () => {
    delete process.env.GLB_MENTOR_MASTER_KEY;
    assert.equal(resolveMentorMasterKey(), null);
  });

  test('refuses the compromised value even when explicitly configured', () => {
    process.env.GLB_MENTOR_MASTER_KEY = BURNED;
    assert.equal(resolveMentorMasterKey(), null);
  });

  test('refuses a key short enough to brute force', () => {
    process.env.GLB_MENTOR_MASTER_KEY = 'short';
    assert.equal(resolveMentorMasterKey(), null);
  });

  test('accepts a sufficiently long configured key', () => {
    process.env.GLB_MENTOR_MASTER_KEY = VALID;
    assert.equal(resolveMentorMasterKey(), VALID);
  });
});

describe('matchesMentorMasterKey', () => {
  test('the burned key never grants mentor, configured or not', () => {
    delete process.env.GLB_MENTOR_MASTER_KEY;
    assert.equal(matchesMentorMasterKey(BURNED), false);

    process.env.GLB_MENTOR_MASTER_KEY = BURNED;
    assert.equal(matchesMentorMasterKey(BURNED), false);
  });

  test('no configured key means nothing matches', () => {
    delete process.env.GLB_MENTOR_MASTER_KEY;
    assert.equal(matchesMentorMasterKey(VALID), false);
    assert.equal(matchesMentorMasterKey(''), false);
  });

  test('matches the configured key exactly', () => {
    process.env.GLB_MENTOR_MASTER_KEY = VALID;
    assert.equal(matchesMentorMasterKey(VALID), true);
    assert.equal(matchesMentorMasterKey(VALID.slice(0, -1)), false);
    assert.equal(matchesMentorMasterKey(`${VALID}x`), false);
  });

  test('non-string input is rejected rather than coerced', () => {
    process.env.GLB_MENTOR_MASTER_KEY = VALID;
    // A JSON body can carry any type; `{registrationKey: {}}` must not throw
    // inside timingSafeEqual, and must not be treated as a match.
    assert.equal(matchesMentorMasterKey(undefined), false);
    assert.equal(matchesMentorMasterKey(null), false);
    assert.equal(matchesMentorMasterKey({}), false);
    assert.equal(matchesMentorMasterKey(123), false);
  });
});

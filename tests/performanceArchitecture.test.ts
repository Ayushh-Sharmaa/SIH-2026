import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SIH_OFFICIAL_17_THEMES } from '../src/lib/tracks';
import { mentorSearchQuerySchema, parseQuery } from '../src/lib/validation';
import { QueryClient } from '../src/lib/queryClient';
import { sanitizeAvatarUrl, parseDataUri } from '../src/lib/avatar';

describe('SIH 17 Official Themes Authority', () => {
  it('defines exactly 17 official SIH themes', () => {
    assert.equal(SIH_OFFICIAL_17_THEMES.length, 17);
  });

  it('contains valid problemStatementCode for all 17 themes', () => {
    SIH_OFFICIAL_17_THEMES.forEach((theme) => {
      assert.ok(theme.problemStatementCode.startsWith('PS-'));
      assert.ok(theme.name.length > 0);
      assert.ok(theme.category.length > 0);
    });
  });
});

describe('Mentor & Team Search Parameter Validation', () => {
  it('safely parses mentor search parameters', () => {
    const url = 'https://sih.glbgoi.ac.in/api/mentors?name=John&expertise=AI%2FML';
    const parsed = parseQuery(url, mentorSearchQuerySchema);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.name, 'John');
      assert.equal(parsed.data.expertise, 'AI/ML');
    }
  });

  it('rejects oversized search strings preventing DoS', () => {
    const longString = 'a'.repeat(200);
    const url = `https://sih.glbgoi.ac.in/api/mentors?name=${longString}`;
    const parsed = parseQuery(url, mentorSearchQuerySchema);
    assert.equal(parsed.success, false);
  });
});

describe('Avatar Sanitation & Abuse Prevention', () => {
  it('replaces inline base64 data URIs with streaming endpoint URLs with cache busting', () => {
    const fakeDataUri1 = 'data:image/jpeg;base64,' + 'A'.repeat(5000);
    const fakeDataUri2 = 'data:image/jpeg;base64,' + 'B'.repeat(5000);
    const sanitized1 = sanitizeAvatarUrl(fakeDataUri1, 'user_123');
    const sanitized2 = sanitizeAvatarUrl(fakeDataUri2, 'user_123');
    assert.ok(sanitized1?.startsWith('/api/avatar/user_123?v='));
    assert.ok(sanitized2?.startsWith('/api/avatar/user_123?v='));
    // Distinct avatar contents generate distinct version hashes
    assert.notEqual(sanitized1, sanitized2);

    // Explicit timestamp version parameter
    const timestamp = 1718000000000;
    const versioned = sanitizeAvatarUrl(fakeDataUri1, 'user_123', timestamp);
    assert.equal(versioned, `/api/avatar/user_123?v=${timestamp}`);
  });

  it('preserves external HTTPS CDN URLs without modification', () => {
    const cdnUrl = 'https://lh3.googleusercontent.com/a/avatar123';
    const sanitized = sanitizeAvatarUrl(cdnUrl, 'user_123');
    assert.equal(sanitized, cdnUrl);
  });

  it('preserves preset icon avatar strings', () => {
    assert.equal(sanitizeAvatarUrl('developer', 'user_123'), 'developer');
    assert.equal(sanitizeAvatarUrl('hacker', 'user_123'), 'hacker');
  });

  it('correctly parses data URIs into MIME and Buffer', () => {
    const sample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const parsed = parseDataUri(sample);
    assert.ok(parsed);
    assert.equal(parsed.mimeType, 'image/png');
    assert.ok(parsed.buffer.length > 0);
  });

  it('rejects invalid or corrupted data URI headers', () => {
    assert.equal(parseDataUri('invalid-string'), null);
    assert.equal(parseDataUri('data:text/plain;notbase64,hello'), null);
  });
});

describe('Client-Side QueryClient Cache & Deduplication', () => {
  it('deduplicates in-flight concurrent requests for the same key', async () => {
    let executionCount = 0;
    const fetcher = async () => {
      executionCount++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { data: 'test-result' };
    };

    const [res1, res2] = await Promise.all([
      QueryClient.fetch('test_dedup_key', fetcher),
      QueryClient.fetch('test_dedup_key', fetcher),
    ]);

    assert.equal(executionCount, 1);
    assert.deepEqual(res1, { data: 'test-result' });
    assert.deepEqual(res2, { data: 'test-result' });
  });

  it('serves from cache within TTL', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { count: callCount };
    };

    const first = await QueryClient.fetch('test_ttl_key', fetcher, { ttlMs: 1000 });
    const second = await QueryClient.fetch('test_ttl_key', fetcher, { ttlMs: 1000 });

    assert.equal(callCount, 1);
    assert.deepEqual(first, second);
  });

  it('invalidates cache correctly', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { count: callCount };
    };

    await QueryClient.fetch('test_inval_key', fetcher, { ttlMs: 1000 });
    QueryClient.invalidate('test_inval_key');
    await QueryClient.fetch('test_inval_key', fetcher, { ttlMs: 1000 });

    assert.equal(callCount, 2);
  });
});

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { avatarDataUri } from '../src/lib/validate';

/**
 * `avatarDataUri` is the only server-side gate on a value that is later rendered
 * as an image src for every viewer of a profile. The failure mode is therefore
 * stored, not reflected: one bad PATCH poisons the avatar for everyone who loads
 * that roster row.
 */

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('avatarDataUri — remote hosts', () => {
  test('accepts the Google apex and its subdomains', () => {
    assert.equal(
      avatarDataUri('https://lh3.googleusercontent.com/a/photo'),
      'https://lh3.googleusercontent.com/a/photo'
    );
    assert.equal(
      avatarDataUri('https://googleusercontent.com/x'),
      'https://googleusercontent.com/x'
    );
  });

  test('rejects a lookalike domain that merely ends in the allowed string', () => {
    // The bug this pins: `hostname.endsWith('googleusercontent.com')` is true
    // for a domain an attacker can register outright.
    assert.equal(avatarDataUri('https://evilgoogleusercontent.com/x'), null);
    assert.equal(avatarDataUri('https://notgoogleusercontent.com/x'), null);
  });

  test('rejects the allowed host in a position that does not own the request', () => {
    // Userinfo and subdomain-of-attacker forms both put the trusted string in
    // the URL without the trusted party serving the bytes.
    assert.equal(avatarDataUri('https://googleusercontent.com@evil.test/x'), null);
    assert.equal(avatarDataUri('https://googleusercontent.com.evil.test/x'), null);
  });

  test('rejects plaintext http even on the allowed host', () => {
    assert.equal(avatarDataUri('http://lh3.googleusercontent.com/a/photo'), null);
  });

  test('rejects an unparseable URL rather than throwing', () => {
    assert.equal(avatarDataUri('https://'), null);
  });
});

describe('avatarDataUri — data URIs', () => {
  test('accepts the raster types the onboarding FileReader produces', () => {
    assert.equal(avatarDataUri(PNG), PNG);
    assert.equal(
      avatarDataUri('data:image/jpeg;base64,/9j/4AAQ=='),
      'data:image/jpeg;base64,/9j/4AAQ=='
    );
  });

  test('rejects SVG, which can carry script', () => {
    assert.equal(avatarDataUri('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='), null);
  });

  test('rejects a non-image data URI', () => {
    assert.equal(avatarDataUri('data:text/html;base64,PGh0bWw+'), null);
    assert.equal(avatarDataUri('javascript:alert(1)'), null);
  });

  test('enforces the size cap the client-side check cannot', () => {
    const huge = `data:image/png;base64,${'A'.repeat(2_100_000)}`;
    assert.equal(avatarDataUri(huge), null);
  });

  test('rejects non-string and empty input', () => {
    assert.equal(avatarDataUri(undefined), null);
    assert.equal(avatarDataUri(null), null);
    assert.equal(avatarDataUri(''), null);
    assert.equal(avatarDataUri(12345), null);
    assert.equal(avatarDataUri({ toString: () => PNG }), null);
  });
});

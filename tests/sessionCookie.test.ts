import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_RETURN_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  clearAdminReturnCookie,
  clearSessionCookie,
  setAdminReturnCookie,
  setSessionCookie,
  type CookieWriter,
} from '../src/lib/sessionCookie';

/**
 * These assertions exist because the attributes they check are the difference
 * between a session cookie that works and one that silently does not. They are
 * invisible in review — nothing about `path: '/'` looks load-bearing until it
 * is missing — so they are pinned here instead.
 */

interface WrittenCookie {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict';
    maxAge: number;
    path: string;
  };
}

function recorder() {
  const written: WrittenCookie[] = [];
  const writer: CookieWriter = {
    set(name, value, options) {
      written.push({ name, value, options });
    },
  };
  return { writer, written, last: () => written[written.length - 1] };
}

describe('session cookie attributes', () => {
  test('session cookie is httpOnly, strict and scoped to the whole site', () => {
    const { writer, last } = recorder();
    setSessionCookie(writer, 'jwt-value');

    const cookie = last();
    assert.equal(cookie.name, SESSION_COOKIE);
    assert.equal(cookie.value, 'jwt-value');
    // httpOnly is what keeps the token out of reach of any XSS that lands.
    assert.equal(cookie.options.httpOnly, true);
    // strict is what currently stands in for CSRF tokens on mutating routes.
    assert.equal(cookie.options.sameSite, 'strict');
    // Omitting path scopes the cookie to the issuing route's directory, so a
    // cookie set by /api/auth/login would never be sent to /dashboard.
    assert.equal(cookie.options.path, '/');
  });

  test('cookie lifetime matches the JWT lifetime', () => {
    // auth.ts signs with `expiresIn: '7d'`. If these two ever drift apart, the
    // browser keeps sending a credential every route rejects, which presents to
    // the user as being randomly signed out with no way to recover.
    assert.equal(SESSION_MAX_AGE_SECONDS, 60 * 60 * 24 * 7);
  });

  test('admin return cookie uses its own name, not the session name', () => {
    const { writer, last } = recorder();
    setAdminReturnCookie(writer, 'admin-jwt');

    assert.equal(last().name, ADMIN_RETURN_COOKIE);
    assert.notEqual(ADMIN_RETURN_COOKIE, SESSION_COOKIE);
    assert.equal(last().options.httpOnly, true);
  });
});

describe('cookie clearing', () => {
  test('clearing expires the value and repeats the original path', () => {
    const { writer, last } = recorder();
    clearSessionCookie(writer);

    const cookie = last();
    assert.equal(cookie.name, SESSION_COOKIE);
    assert.equal(cookie.value, '');
    assert.equal(cookie.options.maxAge, 0);

    // The regression this guards: a cookie is keyed by (name, domain, path).
    // `NextResponse.cookies.delete(name)` emits no Path, so the browser scopes
    // the expiry to the current request's directory. Against a cookie written
    // at '/', that matches nothing and the cookie survives. Two live bugs came
    // from it — a revoked admin's parked token was never cleared, and the auth
    // gate could not break its own redirect loop.
    assert.equal(cookie.options.path, '/', 'clearing must restate path or it will not match');
  });

  test('clearing the admin return cookie also restates path', () => {
    const { writer, last } = recorder();
    clearAdminReturnCookie(writer);

    assert.equal(last().name, ADMIN_RETURN_COOKIE);
    assert.equal(last().options.maxAge, 0);
    assert.equal(last().options.path, '/');
  });

  test('set and clear agree on every attribute except lifetime', () => {
    const { writer, written } = recorder();
    setSessionCookie(writer, 'jwt');
    clearSessionCookie(writer);

    const [set, cleared] = written;
    // Any attribute that differs breaks the match and leaves the cookie in
    // place, so they are compared as a whole rather than field by field.
    const { maxAge: _setAge, ...setRest } = set.options;
    const { maxAge: _clearAge, ...clearRest } = cleared.options;
    assert.deepEqual(clearRest, setRest);
  });
});

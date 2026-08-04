/**
 * The one definition of how session cookies are written.
 *
 * Nine call sites across seven route handlers each hand-rolled this object —
 * login, signup (twice), logout, clerk-sync (twice), me, view-as and return —
 * repeating `httpOnly`, `secure`, `sameSite`, `path` and the literal
 * `60 * 60 * 24 * 7`. They happen to agree today. That is luck, not design: a
 * single missed `secure`, a `sameSite: 'lax'` typo, or a `path` left off in any
 * one of them silently weakens authentication everywhere that route is used,
 * and nothing in review or CI would catch it.
 *
 * Centralising also fixes a live defect. See `clearCookie` below.
 */

/** Session JWT. Read by the proxy gate and by every authenticated route. */
export const SESSION_COOKIE = 'token';

/**
 * Parking slot for an admin's own session while they are viewing the sandbox
 * dashboards. Deliberately a separate cookie: overwriting `token` and hoping to
 * reconstruct the original later would mean re-minting admin rights from
 * scratch, which is a far worse failure mode than losing the return path.
 */
export const ADMIN_RETURN_COOKIE = 'admin_token';

/**
 * Seven days, matching the JWT's own expiry.
 *
 * The two must agree. A cookie outliving its token leaves the browser sending
 * credentials that every route rejects, which presents to the user as being
 * randomly signed out with no way to recover but clearing site data.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Minimal structural type covering both cookie writers in the App Router:
 * `NextResponse.cookies` (a `ResponseCookies`) and the store returned by
 * `await cookies()`. Typing against the shape rather than either concrete class
 * lets one helper serve both without a cast at the call site.
 */
export interface CookieWriter {
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict';
      maxAge: number;
      path: string;
    },
  ): unknown;
}

/**
 * `secure` is conditional because a Secure cookie is dropped outright over
 * plain HTTP, which would make local development impossible to sign into.
 * HSTS plus `upgrade-insecure-requests` (next.config.ts) mean production is
 * never reached over HTTP in the first place.
 *
 * `sameSite: 'strict'` is what currently stands in for CSRF tokens on mutating
 * routes: the browser withholds the cookie on any cross-site request, so a
 * forged form post from another origin arrives unauthenticated.
 *
 * `path: '/'` is not optional. Omit it and the browser scopes the cookie to the
 * directory of the request URI — a cookie set by `/api/auth/login` would be
 * sent only to `/api/auth/*`, so the user would appear signed out everywhere
 * else on the site.
 */
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge,
    path: '/',
  };
}

/** Writes a session cookie carrying `token`. */
export function setSessionCookie(writer: CookieWriter, token: string): void {
  writer.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE_SECONDS));
}

/** Parks an admin's session so `/api/admin/return` can restore it. */
export function setAdminReturnCookie(writer: CookieWriter, token: string): void {
  writer.set(ADMIN_RETURN_COOKIE, token, cookieOptions(SESSION_MAX_AGE_SECONDS));
}

/**
 * Expires a cookie.
 *
 * Written as an explicit `set` with `maxAge: 0` rather than `cookies.delete()`,
 * because deletion is only honoured when the attributes match. A cookie is
 * keyed by (name, domain, path), and `NextResponse.cookies.delete(name)` emits
 * a `Set-Cookie` with no `Path`, which the browser then scopes to the directory
 * of the current request.
 *
 * That is not hypothetical. `/api/admin/return` called `delete('admin_token')`
 * on a cookie written with `path: '/'`. The expiry was scoped to `/api/admin`,
 * matched nothing, and the parked admin JWT stayed in the browser for its full
 * seven days — including on the branch that detects a revoked admin and whose
 * comment reads "clear it out rather than restoring access". Re-stating `path`
 * here is what actually removes it.
 */
export function clearCookie(writer: CookieWriter, name: string): void {
  writer.set(name, '', cookieOptions(0));
}

/** Ends the user's session. */
export function clearSessionCookie(writer: CookieWriter): void {
  clearCookie(writer, SESSION_COOKIE);
}

/** Discards a parked admin session. */
export function clearAdminReturnCookie(writer: CookieWriter): void {
  clearCookie(writer, ADMIN_RETURN_COOKIE);
}

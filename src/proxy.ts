import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SESSION_COOKIE, clearSessionCookie } from '@/lib/sessionCookie';

/**
 * Request gate.
 * Next 16 renamed the `middleware` convention to `proxy`.
 */

const PUBLIC_PATHS = [
  /^\/$/,
  /^\/login/,
  /^\/signup/,
  /^\/api\/auth/,
  /^\/tracks/,
  // The page pattern above does not cover this: `/^\/tracks/` is anchored at the
  // start, so it misses `/api/tracks`, and the matcher below gates every `/api/*`
  // path explicitly. That left the public /tracks page redirecting its own data
  // fetch to /login, along with the three other client pages that read this route
  // on mount. The payload is the build-time theme list — no user data — and the
  // handler is GET-only and `force-static`, so there is nothing here to gate.
  /^\/api\/tracks/,
  /^\/api\/statistics/,
  /^\/sso-callback/,
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.some((regex) => regex.test(pathname));
}

/** True only when the cookie's signature, issuer, audience and claims all check out. */
function hasValidSession(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token) !== null;
}

/** Sends the user to /login, remembering where they were headed. */
function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  // A path, never an absolute URL: `next=https://attacker.example` would turn
  // the post-login redirect into an open redirect.
  url.searchParams.set('next', req.nextUrl.pathname);

  const res = NextResponse.redirect(url);

  // Clearing the rejected cookie is what stops a redirect loop: without it the
  // browser keeps presenting the same unverifiable token on every request and
  // the gate keeps bouncing it back to /login.
  if (req.cookies.has(SESSION_COOKIE)) clearSessionCookie(res.cookies);

  return res;
}

export const proxy = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  if (hasValidSession(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  if (userId) {
    return NextResponse.next();
  }
  
  return redirectToLogin(req);
});

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

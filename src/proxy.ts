import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { verifyToken } from '@/lib/auth';
import { SESSION_COOKIE, clearSessionCookie } from '@/lib/sessionCookie';

/**
 * Request gate.
 * Next 16 renamed the `middleware` convention to `proxy`.
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/api/auth(.*)',
  '/tracks',
]);

const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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
  //
  // This previously used `res.cookies.delete('token')`, which emits no Path and
  // so is scoped by the browser to the directory of the current request —
  // /dashboard, /onboarding, and so on. The cookie is written at '/', the two
  // never matched, and the loop this line exists to prevent could still happen.
  if (req.cookies.has(SESSION_COOKIE)) clearSessionCookie(res.cookies);

  return res;
}

function customAuthProxy(req: NextRequest) {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  if (hasValidSession(req)) {
    return NextResponse.next();
  }
  return redirectToLogin(req);
}

export const proxy = hasClerkKey
  ? clerkMiddleware(async (auth, req) => {
      if (isPublicRoute(req)) {
        return;
      }
      if (hasValidSession(req)) {
        return;
      }

      // Fall back to a live Clerk session (Google users mid-sync)
      try {
        const authObj = await auth();
        if (authObj?.userId) {
          return;
        }
      } catch {
        // Clerk unreachable or misconfigured - fall through to the redirect
      }

      return redirectToLogin(req);
    })
  : (req: NextRequest) => customAuthProxy(req);

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes so Clerk context is available to them
    '/(api|trpc)(.*)',
  ],
};

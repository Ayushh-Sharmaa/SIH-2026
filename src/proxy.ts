import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { verifyToken } from '@/lib/auth';

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
  const token = req.cookies.get('token')?.value;
  if (!token) return false;
  return verifyToken(token) !== null;
}

/** Sends the user to /login, remembering where they were headed. */
function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('next', req.nextUrl.pathname);

  const res = NextResponse.redirect(url);
  if (req.cookies.has('token')) res.cookies.delete('token');
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

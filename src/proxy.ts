import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { verifyToken } from '@/lib/auth';

/**
 * Request gate.
 *
 * SECURITY: this previously admitted any request carrying a cookie merely
 * *named* `token`, without verifying it — `document.cookie = 'token=x'` in the
 * console was enough to walk past the gate. API routes verify properly, so no
 * data was exposed, but protected shells rendered and the check was one
 * refactor away from being the only line of defence. Signatures are now
 * verified.
 *
 * Runtime note: Next 16 renamed the `middleware` convention to `proxy`, which
 * defaults to the Node.js runtime (see node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/proxy.md). The `middleware.ts` filename
 * is still honoured — the build reports it as "Proxy (Middleware)" — and is
 * kept because Clerk resolves its handler from this path. The Node runtime is
 * what allows `jsonwebtoken` to run here at all; on Edge it could not.
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
  // A path only, never an absolute URL: echoing a caller-supplied absolute
  // target back into a redirect is an open-redirect vector.
  url.searchParams.set('next', req.nextUrl.pathname);

  const res = NextResponse.redirect(url);
  // A cookie that failed verification is expired, tampered with, or signed by a
  // rotated secret. Clear it so the user cannot get stuck in a redirect loop.
  if (req.cookies.has('token')) res.cookies.delete('token');
  return res;
}

function customAuthMiddleware(req: NextRequest) {
  if (isPublicRoute(req)) return NextResponse.next();
  if (hasValidSession(req)) return NextResponse.next();
  return redirectToLogin(req);
}

export default hasClerkKey
  ? clerkMiddleware(async (auth, req) => {
      if (isPublicRoute(req)) return;
      if (hasValidSession(req)) return;

      // Fall back to a Clerk OAuth session.
      try {
        const authObj = await auth();
        if (authObj?.userId) return;
      } catch {
        // Clerk unreachable or misconfigured — fall through to protect().
      }

      await auth.protect();
    })
  : (req: NextRequest) => customAuthMiddleware(req);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

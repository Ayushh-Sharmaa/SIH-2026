import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Renamed from middleware.ts: Next.js 16 deprecated the `middleware` file
// convention in favour of `proxy`.

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/api/auth(.*)',
  '/tracks',
]);

const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Without Clerk keys, clerkMiddleware() throws on every request and takes the
// whole site down. Fall back to plain cookie auth instead.
function customAuthProxy(req: NextRequest) {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (token) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

// Wrapping in clerkMiddleware is what makes currentUser() and auth() usable in
// route handlers. Without it every Google sign-in threw inside
// /api/auth/clerk-sync and silently bounced the user back to /login.
export const proxy = hasClerkKey
  ? clerkMiddleware(async (auth, req) => {
      if (isPublicRoute(req)) {
        return;
      }

      // Custom JWT session takes precedence: it is what every non-Google
      // sign-in issues, and what the sandbox and admin flows rely on.
      const token = req.cookies.get('token')?.value;
      if (token) {
        return;
      }

      // Otherwise fall back to a live Clerk session (Google users mid-sync)
      try {
        const authObj = await auth();
        if (authObj?.userId) {
          return;
        }
      } catch {
        // Clerk unreachable or misconfigured - fall through to the redirect
      }

      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    })
  : (req: NextRequest) => customAuthProxy(req);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes so Clerk context is available to them
    '/(api|trpc)(.*)',
  ],
};

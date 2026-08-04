import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/tracks',
  '/api/auth',
];

// Wrapped in clerkMiddleware so currentUser() and auth() work inside route
// handlers. Without this wrapper Clerk throws on every server call, which is
// what silently broke Google sign-in via /api/auth/clerk-sync.
export const proxy = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1. Always allow public routes and authentication APIs
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // 2. Check for custom authentication token cookie ('token')
  const token = req.cookies.get('token')?.value;
  if (token) {
    return NextResponse.next();
  }

  // 3. Fall back to a live Clerk session (Google users mid-sync)
  const { userId } = await auth();
  if (userId) {
    return NextResponse.next();
  }

  // 4. Redirect unauthenticated access to login
  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes so Clerk context is available to them
    '/(api|trpc)(.*)',
  ],
};

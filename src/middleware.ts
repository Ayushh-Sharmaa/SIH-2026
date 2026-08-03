import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/api/auth(.*)',
  '/tracks',
]);

const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function customAuthMiddleware(req: NextRequest) {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Allow navigation if custom auth session cookie "token" exists
  const token = req.cookies.get('token')?.value;
  if (token) {
    return NextResponse.next();
  }

  // Redirect to login if unauthenticated
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export default hasClerkKey
  ? clerkMiddleware(async (auth, req) => {
      if (isPublicRoute(req)) {
        return;
      }

      // Allow navigation if custom auth session cookie "token" exists
      const token = req.cookies.get('token')?.value;
      if (token) {
        return;
      }

      // Allow navigation if Clerk user session exists
      try {
        const authObj = await auth();
        if (authObj && authObj.userId) {
          return;
        }
      } catch (e) {
        // Ignore error if Clerk session check fails
      }

      // Redirect to login if unauthenticated
      await auth.protect();
    })
  : (req: NextRequest) => customAuthMiddleware(req);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

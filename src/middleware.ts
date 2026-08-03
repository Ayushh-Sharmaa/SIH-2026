import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/tracks',
  '/api/auth',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Always allow public static files and Next.js internal assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Always allow public routes and authentication APIs
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // 3. Check for custom authentication token cookie ('token')
  const token = req.cookies.get('token')?.value;
  if (token) {
    return NextResponse.next();
  }

  // 4. Check for Clerk session cookie if present
  const clerkSession = req.cookies.get('__session')?.value;
  if (clerkSession) {
    return NextResponse.next();
  }

  // 5. Redirect unauthenticated access to login
  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

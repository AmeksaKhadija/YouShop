import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/checkout', '/orders', '/admin'];

// Admin-only routes
const adminRoutes = ['/admin'];

// Auth routes (redirect if already logged in)
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Note: Since we use client-side auth with Zustand,
  // we can't access the token directly in middleware.
  // The actual auth check is done in the page components.
  // This middleware is mainly for showing the pattern.

  // In a production app, you might use cookies for JWT storage
  // and validate them here.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};

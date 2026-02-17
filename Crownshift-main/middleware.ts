import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get("admin-token");
  const session = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  // Protect admin routes: require admin-token cookie (set after secure login)
  if (pathname.startsWith("/admin")) {
    if (!adminToken) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  // Protect user dashboard routes: require firebase session cookie named `session`
  if (pathname.startsWith("/dashboard")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/dashboard"],
};
import { NextRequest, NextResponse } from 'next/server';

// Protected routes and their required roles
const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/client': ['client'],
};

// Routes that should not have middleware applied
const excludedPaths = [
  '/_next/',
  '/api/',
  '/public/',
  '/favicon.ico',
  '/robots.txt',
  '/.well-known/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl;

  // Skip middleware for excluded paths
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if the current route is protected
  const matchedRoute = Object.keys(protectedRoutes).find(route =>
    pathname.startsWith(route)
  );

  if (matchedRoute) {
    // Get roles from cookie (array format: ["client","admin"])
    const rolesString = request.cookies.get('roles')?.value;
    const roles: string[] = rolesString ? JSON.parse(rolesString) : [];

    // Get required roles for this route
    const requiredRoles = protectedRoutes[matchedRoute];

    // Check if user has required role
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role));

    if (!hasRequiredRole) {
      // Redirect to unauthorized if no matching role
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

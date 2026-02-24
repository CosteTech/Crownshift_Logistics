import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Minimal Edge-safe middleware protecting /admin routes.
// - No filesystem or Node.js APIs
// - Only checks presence of '__session' cookie
// - Fails open (never throws), redirects unauthenticated users to /admin/login

const ADMIN_BASE = '/admin';
const ADMIN_LOGIN = '/admin/login';
const EXCLUDE_PREFIXES = ['/_next/', '/api/', '/public/', '/favicon.ico', '/robots.txt', '/.well-known/'];

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Fast exits for static and API assets
    if (EXCLUDE_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Only apply logic to admin paths
    if (!pathname.startsWith(ADMIN_BASE)) {
      return NextResponse.next();
    }

    // Always allow the login page
    if (pathname === ADMIN_LOGIN || pathname.startsWith(`${ADMIN_LOGIN}/`)) {
      return NextResponse.next();
    }

    // Check cookie presence only. Do not parse or assume structure here.
    const session = request.cookies.get('__session')?.value;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN;
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    // Fail open: log and let the request continue. Avoid Node-specific APIs.
    // eslint-disable-next-line no-console
    console.error('Middleware error:', err instanceof Error ? err.message : String(err));
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

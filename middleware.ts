import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Use exact matches for paths to avoid accidental 404s
const ADMIN_PATH = '/admin';
const LOGIN_PATH = '/admin/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Let internal Next.js and static files pass through immediately
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // catches .png, .ico, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Admin Protection Logic
  if (pathname.startsWith(ADMIN_PATH) && pathname !== LOGIN_PATH) {
    const session = request.cookies.get('__session')?.value;

    if (!session) {
      // Use the helper to create an absolute URL for the redirect
      const loginUrl = new URL(LOGIN_PATH, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Add Security Headers to all valid requests
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

function addSecurityHeaders(response: NextResponse) {
  const h = response.headers;
  h.set('X-Frame-Options', 'DENY');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' *.firebaseio.com *.googleapis.com;"
  );
  return response;
}

export const config = {
  // Cleaner matcher that stays away from system files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

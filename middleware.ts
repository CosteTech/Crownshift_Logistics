import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ADMIN_ROUTES = ['/admin'];
const EXCLUDED_PATHS = ['/_next/', '/api/', '/public/', '/favicon.ico', '/robots.txt', '/.well-known/'];

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // 1. Skip middleware for static assets early
    if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // 2. Safe Timeout Fallback (No more crashing if variable is missing)
    const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '15', 10);
    const SESSION_TIMEOUT = (isNaN(timeoutMinutes) ? 15 : timeoutMinutes) * 60 * 1000;

    // 3. Clone URL for potential redirects
    const url = request.nextUrl.clone();

    // 4. Admin Route Protection
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      const sessionCookie = request.cookies.get('__session')?.value;

      if (!sessionCookie) {
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }

      try {
        const session = JSON.parse(sessionCookie);
        const now = Date.now();
        const lastActivity = session.lastActivity || now;

        if (now - lastActivity > SESSION_TIMEOUT) {
          url.pathname = '/admin/login';
          const response = NextResponse.redirect(url);
          response.cookies.delete('__session');
          return response;
        }

        // Update session and continue
        session.lastActivity = now;
        const response = NextResponse.next();
        response.cookies.set('__session', JSON.stringify(session), {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: SESSION_TIMEOUT / 1000,
          path: '/',
        });
        return addSecurityHeaders(response);
      } catch (e) {
        url.pathname = '/admin/login';
        const response = NextResponse.redirect(url);
        response.cookies.delete('__session');
        return response;
      }
    }

    // 5. Default Response for non-admin routes
    return addSecurityHeaders(NextResponse.next());

  } catch (error) {
    // Fail-safe: if middleware crashes, let the request through
    console.error('Middleware Error:', error);
    return NextResponse.next();
  }
}

function addSecurityHeaders(response: NextResponse) {
  const h = response.headers;
  h.set('X-Frame-Options', 'DENY');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' *.firebaseio.com *.googleapis.com *.firebasedatabase.app;");
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
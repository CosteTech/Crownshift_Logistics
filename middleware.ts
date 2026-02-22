import { NextRequest, NextResponse } from 'next/server';
import { crypto } from 'node:crypto';

// Routes that require admin access
const adminRoutes = ['/admin'];

// Routes that should not have middleware applied
const excludedPaths = [
  '/_next/',
  '/api/',
  '/public/',
  '/favicon.ico',
  '/robots.txt',
  '/.well-known/',
];

// Session timeout in milliseconds (default: 15 minutes)
const SESSION_TIMEOUT = (parseInt(process.env.SESSION_TIMEOUT_MINUTES || '15') * 60 * 1000);

/**
 * Extract client IP from request headers (works behind proxies)
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

/**
 * Generate CSRF token for forms
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Control what information is sent in Referer header
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Control browser features (disable camera, microphone, geolocation for security)
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)');
  
  // HSTS: Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Content Security Policy - Strict by default, can be relaxed per route
  const cspHeader = nonce
    ? `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' *.firebase.amazonaws.com *.firestore.googleapis.com wss://*.firebaseio.com https://stripe.com;`
    : `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' *.firebase.amazonaws.com *.firestore.googleapis.com wss://*.firebaseio.com https://stripe.com;`;
  
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Disable browser caching for sensitive pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl;
  const startTime = Date.now();

  // ============================================================================
  // HTTPS Enforcement (Production)
  // ============================================================================
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    if (proto !== 'https') {
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
  }

  // ============================================================================
  // Skip middleware for excluded paths (but still add security headers)
  // ============================================================================
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Extract client IP for logging
  const clientIP = getClientIP(request);

  // ============================================================================
  // Session Management & Admin Route Protection
  // ============================================================================
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute) {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      // No session — redirect to admin login
      try {
        console.warn('🚨 [Security] Admin route access attempt without session', {
          pathname,
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // Logging error - continue
      }

      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Verify session hasn't timed out
    try {
      const session = JSON.parse(sessionCookie);
      const lastActivity = session.lastActivity || Date.now();
      const now = Date.now();

      // Check if session has expired
      if (now - lastActivity > SESSION_TIMEOUT) {
        console.warn('🚨 [Security] Session timeout - redirecting to login', {
          ip: clientIP,
          duration: now - lastActivity,
          timeout: SESSION_TIMEOUT,
        });

        url.pathname = '/admin/login';
        const response = NextResponse.redirect(url);
        response.cookies.delete('__session');
        return response;
      }

      // Update last activity timestamp
      session.lastActivity = now;
      const newSessionCookie = JSON.stringify(session);
      
      const response = NextResponse.next();
      response.cookies.set('__session', newSessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_TIMEOUT / 1000,
        path: '/',
      });

      return addSecurityHeaders(response);
    } catch (e) {
      // Session parsing error - treat as invalid session
      url.pathname = '/admin/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('__session');
      return response;
    }
  }

  // ============================================================================
  // Request Logging & Performance Monitoring
  // ============================================================================
  const response = NextResponse.next();
  const duration = Date.now() - startTime;

  // Log slow requests in development
  if (process.env.NODE_ENV === 'development' && duration > 1000) {
    try {
      console.warn('⏱️ [Performance] Slow request detected', {
        method: request.method,
        pathname,
        duration: `${duration}ms`,
        ip: clientIP,
      });
    } catch (e) {
      // Logging error - continue
    }
  }

  // ============================================================================
  // Add Security Headers
  // ============================================================================
  return addSecurityHeaders(response);
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

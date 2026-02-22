/**
 * CORS Configuration for API Routes
 * 
 * Handles Cross-Origin Resource Sharing for API endpoints
 * Restricts access based on environment and endpoint type
 */

import { NextRequest, NextResponse } from 'next/server';

interface CORSOptions {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowCredentials: boolean;
  maxAge: number;
}

// CORS configurations per environment
const CORS_CONFIG: Record<string, CORSOptions> = {
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowCredentials: true,
    maxAge: 86400, // 24 hours
  },
  staging: {
    allowedOrigins: [
      'https://staging.crownshift.com',
      'https://app-staging.crownshift.com',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowCredentials: true,
    maxAge: 86400,
  },
  production: {
    allowedOrigins: [
      'https://crownshift.com',
      'https://app.crownshift.com',
      'https://www.crownshift.com',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowCredentials: true,
    maxAge: 86400,
  },
};

// Webhook-specific CORS (more restrictive)
const WEBHOOK_CORS_CONFIG: Record<string, CORSOptions> = {
  development: {
    allowedOrigins: [
      'https://api.stripe.com',
      'https://api.sandbox.smpp.safaricom.co.ke', // M-Pesa sandbox
      'http://localhost:3000',
    ],
    allowedMethods: ['POST', 'OPTIONS'],
    allowCredentials: false,
    maxAge: 3600,
  },
  production: {
    allowedOrigins: [
      'https://api.stripe.com',
      'https://api.smpp.safaricom.co.ke', // M-Pesa production
    ],
    allowedMethods: ['POST', 'OPTIONS'],
    allowCredentials: false,
    maxAge: 3600,
  },
};

/**
 * Get CORS config for current environment
 */
function getCORSConfig(isWebhook = false): CORSOptions {
  const env = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';
  const config = isWebhook ? WEBHOOK_CORS_CONFIG : CORS_CONFIG;
  return config[env] || config.development;
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;

  // Direct match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check if origin matches pattern (e.g., *.crownshift.com)
  for (const allowed of allowedOrigins) {
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      if (origin.endsWith(domain)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Add CORS headers to response
 */
export function addCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  isWebhook = false
): NextResponse {
  const origin = request.headers.get('origin');
  const config = getCORSConfig(isWebhook);

  if (isOriginAllowed(origin, config.allowedOrigins) && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-CSRF-Token'
  );

  if (config.allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set('Access-Control-Max-Age', config.maxAge.toString());

  // Security headers for API responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCORSPreflight(
  request: NextRequest,
  isWebhook = false
): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const response = new NextResponse(null, { status: 204 });
  return addCORSHeaders(response, request, isWebhook);
}

/**
 * Middleware-style CORS handler
 * Usage in your API route:
 * 
 * export async function POST(request: NextRequest) {
 *   const preflightResponse = handleCORSPreflight(request);
 *   if (preflightResponse) return preflightResponse;
 *   
 *   const response = NextResponse.json({ ... });
 *   return addCORSHeaders(response, request);
 * }
 */

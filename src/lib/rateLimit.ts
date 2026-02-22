/**
 * In-memory rate limiting implementation
 * Can be upgraded to Redis for distributed systems
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Check if request exceeds rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = store[identifier];
  
  // Create new entry if doesn't exist or window expired
  if (!entry || now > entry.resetTime) {
    store[identifier] = {
      requests: 1,
      resetTime: now + config.windowMs,
    };
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: store[identifier].resetTime,
    };
  }
  
  // Check if within limit
  if (entry.requests < config.maxRequests) {
    entry.requests++;
    return {
      success: true,
      remaining: config.maxRequests - entry.requests,
      resetTime: entry.resetTime,
    };
  }
  
  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 min
  SIGNUP: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  
  // Payments
  STRIPE_CHECKOUT: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  MPESA_CALLBACK: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
  
  // Forms
  CONTACT_FORM: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour
  QUOTE_REQUEST: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour
  
  // API endpoints
  ADMIN_API: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  USER_API: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute
  PUBLIC_API: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
  
  // Webhooks
  WEBHOOK_STRIPE: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 per minute
};

/**
 * Create a rate limit identifier from IP
 */
export function getRateLimitKey(
  type: string,
  identifier: string
): string {
  return `${type}:${identifier}`;
}

/**
 * Clean up old entries (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

/**
 * Reset all rate limits (for testing)
 */
export function resetRateLimitStore() {
  for (const key in store) {
    delete store[key];
  }
}

// Clean up every 5 minutes
if (typeof globalThis !== 'undefined' && !globalThis._rateLimitCleanupSet) {
  globalThis._rateLimitCleanupSet = true;
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

export default {
  checkRateLimit,
  getRateLimitKey,
  RATE_LIMITS,
  cleanupRateLimitStore,
  resetRateLimitStore,
};

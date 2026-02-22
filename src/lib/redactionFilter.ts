/**
 * Redaction utilities for sensitive data in logs
 */

const SENSITIVE_FIELDS = [
  'password', 'token', 'sessionId', 'uid', 'email', 
  'phone', 'creditCard', 'ssn', 'apiKey', 'secret',
  'authorization', 'x-api-key', 'access_token', 'refresh_token',
  'stripe_token', 'mpesa', 'firebase', 'privateKey'
];

const SENSITIVE_PATTERNS = [
  /Bearer\s+[^\s]+/gi,           // Bearer tokens
  /sk_live_[^\s]+/gi,            // Stripe live keys
  /sk_test_[^\s]+/gi,            // Stripe test keys
  /pk_live_[^\s]+/gi,            // Stripe publishable keys
  /rk_live_[^\s]+/gi,            // Stripe restricted keys
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b\d{10,}\b/g,                // Phone numbers
  /[0-9]{13,19}\b/g,             // Credit card numbers
];

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.some(field => 
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
}

/**
 * Redact sensitive patterns from string
 */
function redactPatterns(str: string): string {
  if (typeof str !== 'string') return str;
  
  let result = str;
  SENSITIVE_PATTERNS.forEach(pattern => {
    result = result.replace(pattern, '[REDACTED]');
  });
  return result;
}

/**
 * Recursively redact sensitive data from object
 */
export function redactSensitiveData(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return '[REDACTED_DEPTH_LIMIT]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return redactPatterns(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }
  
  const redacted: any = {};
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    // Check if field is sensitive
    if (isSensitiveField(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'string') {
      // Check for patterns in string values
      redacted[key] = redactPatterns(obj[key]);
    } else if (typeof obj[key] === 'object') {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(obj[key], depth + 1);
    } else {
      redacted[key] = obj[key];
    }
  }
  
  return redacted;
}

/**
 * Redact sensitive headers
 */
export function redactHeaders(headers: Record<string, any>): Record<string, any> {
  const SENSITIVE_HEADERS = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token',
    'stripe-signature', 'x-stripe-signature', 'auth-token'
  ];
  
  const redacted: any = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.some(sh => key.toLowerCase().includes(sh))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Build a safe request log object
 */
export function buildSafeRequestLog(request: {
  method: string;
  url: string;
  headers?: Record<string, any>;
  body?: any;
  ip?: string;
}) {
  return {
    method: request.method,
    url: request.url,
    headers: request.headers ? redactHeaders(request.headers) : undefined,
    body: request.body ? redactSensitiveData(request.body) : undefined,
    ip: request.ip,
  };
}

/**
 * Build a safe response log object
 */
export function buildSafeResponseLog(response: {
  status: number;
  body?: any;
  headers?: Record<string, any>;
}) {
  return {
    status: response.status,
    body: response.body ? redactSensitiveData(response.body) : undefined,
    headers: response.headers ? redactHeaders(response.headers) : undefined,
  };
}

export default {
  redactSensitiveData,
  redactHeaders,
  buildSafeRequestLog,
  buildSafeResponseLog,
};

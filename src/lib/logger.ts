import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const enableFileLogs = isProduction && process.env.ENABLE_FILE_LOGS === 'true' && !process.env.VERCEL;

// Create Winston logger for structured logging
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'crownshift-api' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          ),
    }),
    // Opt-in file logging only for writable environments (not Vercel serverless).
    ...(enableFileLogs ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ] : []),
  ],
});

/**
 * Log security event with optional Sentry integration
 */
export function logSecurityEvent(
  event: 'AUTH_FAILURE' | 'UNAUTHORIZED_ACCESS' | 'INVALID_INPUT' | 'RATE_LIMIT' | 'WEBHOOK_INVALID',
  details?: any
) {
  logger.warn('Security event', { event, details });
  
  // Send to Sentry if configured
  if (typeof window === 'undefined' && process.env.SENTRY_DSN) {
    try {
      import('@sentry/nextjs').then(Sentry => {
        Sentry.captureMessage(`Security: ${event}`, 'warning');
      });
    } catch (e) {
      // Sentry not initialized
    }
  }
}

/**
 * Log error with optional Sentry integration
 */
export function logError(
  error: Error | string,
  context?: Record<string, any>
) {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;
  
  logger.error('Error occurred', {
    message,
    stack,
    context,
  });
  
  // Send to Sentry if configured
  if (typeof window === 'undefined' && process.env.SENTRY_DSN) {
    try {
      import('@sentry/nextjs').then(Sentry => {
        if (typeof error !== 'string') {
          Sentry.captureException(error, { extra: context });
        } else {
          Sentry.captureMessage(message, 'error');
        }
      });
    } catch (e) {
      // Sentry not initialized
    }
  }
}

/**
 * Log API request (use in middleware or routes)
 */
export function logRequest(
  method: string,
  pathname: string,
  options?: {
    ip?: string;
    userAgent?: string;
    duration?: number;
    status?: number;
    userId?: string;
    companyId?: string;
  }
) {
  const level = options?.status && options.status >= 400 ? 'warn' : 'info';
  logger[level as any]('Request', {
    method,
    pathname,
    ...options,
  });
}

/**
 * Log slow request (duration > 1000ms)
 */
export function logSlowRequest(
  method: string,
  pathname: string,
  duration: number,
  options?: Record<string, any>
) {
  logger.warn('Slow request detected', {
    method,
    pathname,
    duration,
    threshold: '1000ms',
    ...options,
  });
}

export default logger;

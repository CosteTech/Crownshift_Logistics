/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are present
 * and properly configured for the application to function correctly.
 * 
 * It separates:
 * - Public variables (safe to expose to client)
 * - Server-only variables (must never reach the client)
 */

// ===== PUBLIC VARIABLES (Safe to expose) =====
export const publicEnvVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ADMIN_DEBUG: process.env.NEXT_PUBLIC_ADMIN_DEBUG,
  NEXT_PUBLIC_BUSINESS_PHONE: process.env.NEXT_PUBLIC_BUSINESS_PHONE,
  NEXT_PUBLIC_BUSINESS_COUNTRY: process.env.NEXT_PUBLIC_BUSINESS_COUNTRY,
} as const;

// ===== SERVER-ONLY VARIABLES (Must NOT reach the client) =====
export const serverOnlyEnvVars = {
  FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  FIREBASE_ADMIN_STORAGE_BUCKET: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  TARGET_MAILBOX: process.env.TARGET_MAILBOX,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
  MPESA_PASSKEY: process.env.MPESA_PASSKEY,
  MPESA_ENV: process.env.MPESA_ENV,
  FLW_SECRET_KEY: process.env.FLW_SECRET_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
} as const;

// ===== REQUIRED VARIABLES FOR DIFFERENT DEPLOYMENT CONTEXTS =====
const requiredForClient = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_BASE_URL',
] as const;

const requiredForServer = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'ADMIN_EMAIL',
] as const;

/**
 * Validates environment variables
 * Should be called during application startup or module initialization
 */
export function validateEnvironmentVariables(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required client variables
  for (const envVar of requiredForClient) {
    if (!process.env[envVar]) {
      errors.push(`❌ Missing required environment variable: ${envVar}`);
    }
  }

  // Check required server variables (only in production or actual server context)
  if (typeof window === 'undefined') { // We're on the server
    for (const envVar of requiredForServer) {
      if (!process.env[envVar as unknown as string]) {
        if (process.env.NODE_ENV === 'production') {
          errors.push(`❌ Missing required environment variable: ${envVar}`);
        } else {
          warnings.push(`⚠️  Optional in development: ${envVar}`);
        }
      }
    }
  }

  // Verify no server-only variables are exposed to client
  if (typeof window !== 'undefined') {
    const exposedSecrets = Object.keys(serverOnlyEnvVars).filter(
      key => (window as any)[key] !== undefined
    );
    if (exposedSecrets.length > 0) {
      errors.push(`❌ Server-only variables exposed to client: ${exposedSecrets.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logs environment validation results
 */
export function logEnvironmentValidation(): void {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid) {
    console.error('🚨 Environment validation failed:');
    validation.errors.forEach(error => console.error(error));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    validation.warnings.forEach(warning => console.warn(warning));
  }
  
  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ Environment variables validated successfully');
  }
}

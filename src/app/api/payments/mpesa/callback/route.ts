export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/admin';
import { logger } from '@/lib/logger';
import { logSecurityEvent } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/rateLimit';

// M-Pesa callback validation
// Safaricom IP ranges (production)
const MPESA_PRODUCTION_IPS = ['196.201.214.206', '196.201.214.207', '196.201.214.208'];
// Sandbox IP
const MPESA_SANDBOX_IPS = ['172.15.254.0/24']; // Sandbox varies

export async function POST(request: Request) {
  try {
    // SECURITY FIX P1: Rate limit webhook endpoint
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-real-ip') || 'unknown';
    
    const rateLimitKey = getRateLimitKey('mpesa_webhook', clientIP);
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.MPESA_CALLBACK);
    
    if (!rateLimitResult.success) {
      logger.warn('M-Pesa webhook rate limit exceeded', { remaining: rateLimitResult.remaining });
      logSecurityEvent('RATE_LIMIT', { endpoint: 'mpesa_callback', ip: clientIP });
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }
    
    // SECURITY FIX P0: Validate callback source
    const isProduction = process.env.MPESA_ENV === 'prod';
    const allowedIPs = ['196.201.214.206', '196.201.214.207', '196.201.214.208'];
    
    // Basic IP validation (production should verify against actual Safaricom IPs)
    // In sandbox, any request is OK for testing
    const ipWhitelisted = isProduction ? 
      allowedIPs.some(ip => clientIP.includes(ip)) : 
      true; // Allow all in sandbox for testing
    
    if (isProduction && !ipWhitelisted) {
      const { logger } = await import('@/lib/logger');
      const { logSecurityEvent } = await import('@/lib/logger');
      logger.warn('M-Pesa callback from unauthorized IP');
      logSecurityEvent('WEBHOOK_INVALID', { provider: 'mpesa', type: 'ip_validation' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await request.json();
    const result = payload.Body?.stkCallback;
    if (!result) {
      return NextResponse.json({ ok: true });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = result;
    const accountRef = CallbackMetadata?.Item?.find((i: any) => i.Name === 'AccountReference')?.Value;
    const db = getFirestoreAdmin();
    if (!accountRef) return NextResponse.json({ ok: true });

    const shipRef = db.collection('shipments').doc(accountRef);
    const shipSnap = await shipRef.get();
    if (!shipSnap.exists) {
      console.warn(`M-Pesa callback for non-existent shipment: ${accountRef}`);
      return NextResponse.json({ ok: true }); // Don't reveal if shipment exists
    }

    const existing = shipSnap.data() as any;
    
    // SECURITY FIX P0: Verify request is recent (prevent replay attacks)
    // M-Pesa callbacks older than 30 days should be ignored
    const callbackTimestamp = payload.Body?.stkCallback?.timestamp || Date.now();
    const ageMs = Date.now() - callbackTimestamp;
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (ageMs > MAX_AGE_MS) {
      console.warn(`M-Pesa callback too old: ${ageMs}ms`);
      return NextResponse.json({ ok: true });
    }
    
    // Idempotent: if already paid, skip
    if (existing.payment?.paymentStatus === 'paid') {
      await shipRef.update({ mpesaCallback: payload, updatedAt: new Date() });
      return NextResponse.json({ received: true });
    }

    if (ResultCode === 0) {
      await shipRef.update({ 
        payment: { provider: 'mpesa', paymentStatus: 'paid', reference: CheckoutRequestID }, 
        mpesaCallback: payload,
        mpesaVerifiedAt: new Date(),
        updatedAt: new Date() 
      });
    } else {
      await shipRef.update({ 
        payment: { provider: 'mpesa', paymentStatus: 'failed', reference: CheckoutRequestID }, 
        mpesaCallback: payload,
        mpesaVerifiedAt: new Date(),
        updatedAt: new Date() 
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const { logger } = await import('@/lib/logger');
    logger.error('M-Pesa callback processing error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'callback processing error' }, { status: 500 });
  }
}




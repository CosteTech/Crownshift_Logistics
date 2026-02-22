import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestoreAdmin } from '@/firebase/server-init';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/rateLimit';

// Create Stripe client with API key if available
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
};

const stripe = getStripe();

export async function POST(request: Request) {
  try {
    // SECURITY FIX P1: Rate limit webhook endpoint
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-real-ip') || 'unknown';
    
    const rateLimitKey = getRateLimitKey('stripe_webhook', clientIP);
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.WEBHOOK_STRIPE);
    
    if (!rateLimitResult.success) {
      logger.warn('Stripe webhook rate limit exceeded');
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }
    
    if (!stripe) {
      logger.error('Stripe is not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }
    
    const sig = request.headers.get('stripe-signature') || '';
    const body = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      logger.error('Invalid Stripe webhook signature', { error: err?.message });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const db = getFirestoreAdmin();

    // Idempotency: use event.id stored in webhookEvents
    const recorded = await db.collection('webhookEvents').doc(event.id).get();
    if (recorded.exists) {
      return NextResponse.json({ received: true });
    }

    // Process relevant events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const shipmentId = session.metadata?.shipmentId;
      if (shipmentId) {
        const shipRef = db.collection('shipments').doc(shipmentId);
        const shipSnap = await shipRef.get();
        if (shipSnap.exists) {
          const s = shipSnap.data() as any;
          // idempotent: skip if already paid
          if (s.payment?.paymentStatus !== 'paid') {
            await shipRef.update({ payment: { provider: 'stripe', paymentStatus: 'paid', reference: session.id }, updatedAt: new Date() });
          }
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const shipmentId = (pi.metadata && (pi.metadata as any).shipmentId) || undefined;
      if (shipmentId) {
        const shipRef = db.collection('shipments').doc(shipmentId);
        const shipSnap = await shipRef.get();
        if (shipSnap.exists) {
          await shipRef.update({ payment: { provider: 'stripe', paymentStatus: 'failed', reference: pi.id }, updatedAt: new Date() });
        }
      }
    }

    // Record processed webhook for idempotency
    // SECURITY FIX P1: Store only event ID + type, not full payload (prevents PII storage)
    await db.collection('webhookEvents').doc(event.id).set({
      type: event.type,
      receivedAt: new Date(),
      shipmentId: event.type === 'checkout.session.completed' 
        ? (event.data.object as any).metadata?.shipmentId 
        : undefined,
      // Don't store raw body - it contains customer PII
    }, { merge: true });

    return NextResponse.json({ received: true });
  } catch (err: any) {
    logger.error('Stripe webhook processing error', { error: err?.message });
    return NextResponse.json({ error: 'processing error' }, { status: 500 });
  }
}

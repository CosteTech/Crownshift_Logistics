import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestoreAdmin } from '@/firebase/server-init';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature') || '';
  const body = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Invalid Stripe webhook signature', err?.message || err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = getFirestoreAdmin();
  try {
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
    await db.collection('webhookEvents').doc(event.id).set({ type: event.type, receivedAt: new Date(), raw: JSON.parse(body) });

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook handler error', err?.message || err);
    return NextResponse.json({ error: 'processing error' }, { status: 500 });
  }
}

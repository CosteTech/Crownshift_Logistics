import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestoreAdmin } from '@/firebase/server-init';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature') || '';
  const body = await request.text();

  let event: Stripe.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const shipmentId = session.metadata?.shipmentId;
      if (shipmentId) {
        const db = getFirestoreAdmin();
        const shipRef = db.collection('shipments').doc(shipmentId);
        const shipSnap = await shipRef.get();
        if (shipSnap.exists) {
          const s = shipSnap.data() as any;
          if (s.payment?.paymentStatus !== 'paid') {
            await shipRef.update({ payment: { provider: 'stripe', paymentStatus: 'paid', reference: session.id }, updatedAt: new Date() });
          }
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error', err);
    return NextResponse.json({ error: 'processing error' }, { status: 500 });
  }
}

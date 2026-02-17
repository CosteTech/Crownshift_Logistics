import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestoreAdmin } from '@/firebase/server-init';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', shipmentId, success_url, cancel_url, companyId } = body as any;
    if (!shipmentId || !amount || !companyId) return NextResponse.json({ error: 'missing params' }, { status: 400 });

    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      await requireCompanyFromRequest(request.headers, companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `Shipment ${shipmentId}` },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${process.env.NEXT_PUBLIC_BASE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL}/payments/cancel`,
      metadata: { shipmentId },
    });

    // Verify shipment ownership and record payment reference server-side
    const db = getFirestoreAdmin();
    const snap = await db.collection('shipments').doc(shipmentId).get();
    if (!snap.exists) return NextResponse.json({ error: 'shipment not found' }, { status: 404 });
    const s = snap.data() as any;
    if (s.companyId !== companyId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    await db.collection('shipments').doc(shipmentId).update({ payment: { provider: 'stripe', paymentStatus: 'pending', reference: session.id }, updatedAt: new Date() });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error('Stripe checkout error', err);
    return NextResponse.json({ error: err.message || 'stripe error' }, { status: 500 });
  }
}

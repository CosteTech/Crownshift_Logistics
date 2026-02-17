import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/server-init';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    // The MPesa callback structure varies; store raw payload and update status when success
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
    if (!shipSnap.exists) return NextResponse.json({ ok: true });

    const existing = shipSnap.data() as any;
    // idempotent: if already paid, skip
    if (existing.payment?.paymentStatus === 'paid') {
      await shipRef.update({ mpesaCallback: payload, updatedAt: new Date() });
      return NextResponse.json({ received: true });
    }

    if (ResultCode === 0) {
      await shipRef.update({ payment: { provider: 'mpesa', paymentStatus: 'paid', reference: CheckoutRequestID }, mpesaCallback: payload, updatedAt: new Date() });
    } else {
      await shipRef.update({ payment: { provider: 'mpesa', paymentStatus: 'failed', reference: CheckoutRequestID }, mpesaCallback: payload, updatedAt: new Date() });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('mpesa callback error', err);
    return NextResponse.json({ error: 'callback processing error' }, { status: 500 });
  }
}

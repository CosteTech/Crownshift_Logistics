import { NextResponse } from 'next/server';
import axios from 'axios';
import { getFirestoreAdmin } from '@/firebase/server-init';

// Note: This is a minimal STK Push scaffold. Configure env vars:
// MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_ENV (sandbox|prod)

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('MPesa credentials not configured');
  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  const url = process.env.MPESA_ENV === 'prod' ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials' : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const res = await axios.get(url, { headers: { Authorization: `Basic ${token}` } });
  return res.data.access_token;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, shipmentId, companyId } = body;
      if (!phone || !amount || !shipmentId || !companyId) return NextResponse.json({ error: 'missing' }, { status: 400 });

    // validate company from token
    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      await requireCompanyFromRequest(request.headers, companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortcode = process.env.MPESA_SHORTCODE || '';
    const passkey = process.env.MPESA_PASSKEY || '';
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const url = process.env.MPESA_ENV === 'prod' ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest' : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const res = await axios.post(
      url,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/mpesa/callback`,
        AccountReference: shipmentId,
        TransactionDesc: `Payment for shipment ${shipmentId}`,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Mark payment pending in Firestore (server-side only)
    const db = getFirestoreAdmin();
    const shipRef = db.collection('shipments').doc(shipmentId);
    const shipSnap = await shipRef.get();
    if (!shipSnap.exists) return NextResponse.json({ error: 'shipment not found' }, { status: 404 });
    const shipData = shipSnap.data() as any;
      if (shipData.companyId !== companyId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    await shipRef.update({ payment: { provider: 'mpesa', paymentStatus: 'pending', reference: res.data.CheckoutRequestID || res.data }, mpesaRequest: res.data, updatedAt: new Date() });

    return NextResponse.json({ started: true, data: res.data });
  } catch (err: any) {
    console.error('MPesa STK error', err?.response?.data || err.message || err);
    return NextResponse.json({ error: err?.message || 'mpesa error' }, { status: 500 });
  }
}

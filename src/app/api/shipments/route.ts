import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/server-init';

// Create or update shipments with server-side company enforcement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requireCompanyFromRequest } = await import('@/lib/companyContext');
    // will throw if missing/invalid token
    const res = await requireCompanyFromRequest(request.headers, body.companyId);
    const companyId = res.companyId;

    const db = getFirestoreAdmin();

    // Create new shipment
    const data = { ...body };
    delete data.companyId; // server will set
    // prevent client from setting sensitive fields
    delete data.payment;
    delete data.paymentStatus;
    delete data.invoiceUrl;
    delete data.trackingNumber;

    const docRef = db.collection('shipments').doc();
    await docRef.set({ ...data, companyId, createdAt: new Date(), updatedAt: new Date() });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: any) {
    console.error('Create shipment error', err);
    return NextResponse.json({ error: err?.message || 'create error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, updates, companyId } = body as { id: string; updates: any; companyId?: string };
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const { requireCompanyFromRequest } = await import('@/lib/companyContext');
    const res = await requireCompanyFromRequest(request.headers, companyId);
    const callerCompany = res.companyId;

    const db = getFirestoreAdmin();
    const ref = db.collection('shipments').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const s = snap.data() as any;
    if (s.companyId !== callerCompany) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    // Remove sensitive fields from updates
    const allowed = { ...updates };
    delete allowed.payment;
    delete allowed.paymentStatus;
    delete allowed.invoiceUrl;
    delete allowed.trackingNumber;

    allowed.updatedAt = new Date();
    await ref.update(allowed);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Update shipment error', err);
    return NextResponse.json({ error: err?.message || 'update error' }, { status: 500 });
  }
}

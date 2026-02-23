import { NextResponse } from 'next/server';
import { getFirestoreAdmin, verifyAdminToken } from '@/firebase/server-init';

/**
 * Admin shipment fetch endpoint
 * @route GET /api/admin/shipments/[id]
 * @access Admin only (bypasses Firestore rules via Admin SDK)
 * @security Requires valid admin token; enforces company isolation
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const decoded = await verifyAdminToken(token).catch(() => null);
    if (!decoded) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const db = getFirestoreAdmin();
    const docRef = db.collection('shipments').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const shipData = snap.data() as Record<string, unknown>;
    const companyId = (decoded as { companyId?: string }).companyId;

    if (companyId && shipData.companyId && companyId !== shipData.companyId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const data = { id: snap.id, ...shipData };
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'server error' },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/admin';
import { serializeShipment } from '@/lib/firestore-serializers';
import { requireAdminFromRequest } from '@/lib/server/admin-auth';

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

    const decoded = await requireAdminFromRequest(request);

    const db = getFirestoreAdmin();
    const docRef = db.collection('shipments').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const shipData = snap.data() as Record<string, unknown>;
    const companyId = typeof decoded.companyId === 'string' ? decoded.companyId : null;

    if (companyId && shipData.companyId && companyId !== shipData.companyId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const data = serializeShipment(shipData, snap.id);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'server error';
    const status =
      message.includes('Missing authentication token') ||
      message.includes('Invalid token') ||
      message.includes('Insufficient privileges')
        ? 403
        : message.includes('ADMIN_EMAILS is not configured')
          ? 500
          : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}



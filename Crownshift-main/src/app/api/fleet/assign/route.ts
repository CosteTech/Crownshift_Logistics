import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/server-init';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, shipmentId, vehicleId, driverId } = body as { companyId: string; shipmentId: string; vehicleId: string; driverId: string };
    if (!companyId || !shipmentId || !vehicleId || !driverId) return NextResponse.json({ error: 'missing params' }, { status: 400 });

    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      await requireCompanyFromRequest(request.headers, companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    const db = getFirestoreAdmin();

    await db.runTransaction(async (tx: any) => {
      const vehicleRef = db.collection('vehicles').doc(vehicleId);
      const driverRef = db.collection('drivers').doc(driverId);

      const [vSnap, dSnap] = await Promise.all([tx.get(vehicleRef), tx.get(driverRef)]);
      if (!vSnap.exists) throw new Error('vehicle not found');
      if (!dSnap.exists) throw new Error('driver not found');

      const vData = vSnap.data();
      const dData = dSnap.data();

      if (vData.companyId !== companyId || dData.companyId !== companyId) throw new Error('company mismatch');
      if (vData.status !== 'available') throw new Error('vehicle unavailable');
      if (dData.status !== 'available') throw new Error('driver unavailable');

      // create assignment
      const assignmentRef = db.collection('vehicleAssignments').doc();
      tx.set(assignmentRef, { companyId, shipmentId, vehicleId, driverId, assignedAt: new Date() });

      // update vehicle and driver status
      tx.update(vehicleRef, { status: 'in-transit' });
      tx.update(driverRef, { status: 'assigned' });
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Fleet assign error', err);
    return NextResponse.json({ error: err.message || 'assign error' }, { status: 500 });
  }
}

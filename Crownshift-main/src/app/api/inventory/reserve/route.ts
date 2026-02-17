import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/server-init';

type ReserveItem = { sku: string; warehouseId: string; quantity: number };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, companyId, shipmentId } = body as { items: ReserveItem[]; companyId: string; shipmentId?: string };
    if (!items || !Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'missing items' }, { status: 400 });
    if (!companyId) return NextResponse.json({ error: 'missing companyId' }, { status: 400 });

    // Validate authenticated company from token
    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      await requireCompanyFromRequest(request.headers, companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    const db = getFirestoreAdmin();

    await db.runTransaction(async (tx: any) => {
      for (const item of items) {
        const q = db.collection('inventory').where('companyId', '==', companyId).where('warehouseId', '==', item.warehouseId).where('sku', '==', item.sku).limit(1);
        const snap = await tx.get(q);
        if (snap.empty) throw new Error(`Inventory not found for sku ${item.sku}`);
        const doc = snap.docs[0];
        const data = doc.data();
        const available = data.quantityAvailable ?? 0;
        const reserved = data.quantityReserved ?? 0;
        if (available - item.quantity < 0) throw new Error(`Insufficient stock for sku ${item.sku}`);

        tx.update(doc.ref, { quantityAvailable: available - item.quantity, quantityReserved: reserved + item.quantity, updatedAt: new Date() });

        // record movement
        const movement = {
          companyId,
          sku: item.sku,
          warehouseId: item.warehouseId,
          type: 'outbound',
          quantity: item.quantity,
          relatedShipmentId: shipmentId || null,
          createdAt: new Date(),
        };
        const mvRef = db.collection('inventoryMovements').doc();
        tx.set(mvRef, movement);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Reserve stock error', err);
    return NextResponse.json({ error: err.message || 'reserve error' }, { status: 500 });
  }
}

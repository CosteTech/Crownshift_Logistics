import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFirestoreAdmin, getAdminAuth } from '@/firebase/server-init';
import ShipmentTimeline from '@/components/ShipmentTimeline';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Shipment ${params.id} — Dashboard` };
}

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return redirect('/login');

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(session).catch(() => null);
    if (!decoded) return redirect('/login');

    const db = getFirestoreAdmin();
    const doc = await db.collection('shipments').doc(params.id).get();
    if (!doc.exists) return <div>Shipment not found</div>;
    const shipment = doc.data();

    // Ensure the user owns this shipment or is admin
    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (shipment.customerId !== decoded.uid && decoded.uid !== ADMIN_UID) {
      return <div className="text-red-600">Forbidden</div>;
    }

    return (
      <div>
        <h1 className="text-2xl font-semibold">Shipment {shipment.trackingNumber}</h1>
        <p className="text-sm text-gray-500">Status: {shipment.status}</p>
        <div className="mt-6">
          {/* ShipmentTimeline is client-only and animated */}
          <ShipmentTimeline timeline={shipment.timeline} />
        </div>
      </div>
    );
  } catch (err) {
    console.error('Shipment detail error', err);
    return <div className="text-red-600">Unable to load shipment.</div>;
  }
}

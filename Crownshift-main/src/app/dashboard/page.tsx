import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getFirestoreAdmin, getAdminAuth } from '@/firebase/server-init';

export const metadata = {
  title: 'Dashboard — Crownshift',
  description: 'Your shipments and account overview',
};

export default async function DashboardPage() {
  const cookieStore = cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return redirect('/login');

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(session).catch(() => null);
    if (!decoded) return redirect('/login');

    const db = getFirestoreAdmin();
    const res = await db.collection('shipments').where('customerId', '==', decoded.uid).orderBy('createdAt', 'desc').limit(50).get();
    const shipments = res.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return (
      <div>
        <h1 className="text-2xl font-semibold">My Shipments</h1>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipments.map((s: any) => (
            <div key={s.id} className="p-4 bg-white rounded shadow">
              <p className="text-sm text-gray-500">Tracking</p>
              <h3 className="font-medium">{s.trackingNumber}</h3>
              <p className="text-sm">Status: {s.status}</p>
              <p className="text-sm">ETA: {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleString() : 'N/A'}</p>
              <a className="inline-block mt-3 text-blue-600" href={`/dashboard/shipments/${s.id}`}>View details</a>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (err) {
    console.error('Dashboard error', err);
    return <div className="text-red-600">Unable to load dashboard.</div>;
  }
}

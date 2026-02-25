export const runtime = "nodejs";

import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getFirestoreAdmin, getAdminAuth } from '@/firebase/admin';
import ShipmentTimeline from '@/components/ShipmentTimeline';
import { Shipment } from '@/lib/firestore-models';
import { serializeShipment } from '@/lib/firestore-serializers';

/**
 * Server-side tracking page
 * 
 * SECURITY:
 * - User can only view shipments they own (customerId == uid)
 * - OR admins can view any shipment for their company
 * - No unauthenticated public access
 */
export default async function TrackingPage({ params }: { params: { trackingNumber: string } }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('__session')?.value;
  
  // Require authentication
  if (!session) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/tracking/${params.trackingNumber}`));
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(session, true).catch(() => null);
    if (!decoded) {
      redirect('/login?callbackUrl=' + encodeURIComponent(`/tracking/${params.trackingNumber}`));
    }

    const db = getFirestoreAdmin();
    
    // Query shipments by trackingNumber (assuming it's the doc ID or a field)
    const query = db.collection('shipments').where('trackingNumber', '==', params.trackingNumber).limit(1);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold mb-4">Shipment Not Found</h1>
          <p className="text-gray-600">
            No shipment found with tracking number: <code className="bg-gray-100 px-2 py-1">{params.trackingNumber}</code>
          </p>
        </div>
      );
    }

    const shipmentDoc = snapshot.docs[0];
    const shipment = serializeShipment(shipmentDoc.data(), shipmentDoc.id) as Shipment & {
      customerId: string;
      companyId: string;
    };

    // Authorization: User must own shipment OR be admin for the company
    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
    const isOwner = decoded.uid === shipment.customerId;
    const isAdmin = decoded.uid === ADMIN_UID && decoded.companyId === shipment.companyId;
    
    if (!isOwner && !isAdmin) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to view this shipment.
          </p>
        </div>
      );
    }

    // Render shipment tracking
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Tracking #{shipment.trackingNumber}</h1>
          <p className="text-gray-600 mb-6">
            Status: <span className="font-semibold">{shipment.status}</span>
          </p>
          
          {shipment.timeline && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Shipment Timeline</h2>
              <ShipmentTimeline timeline={shipment.timeline} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Origin</h3>
              <p className="text-sm text-gray-700">{shipment.origin || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Destination</h3>
              <p className="text-sm text-gray-700">{shipment.destination || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Estimated Delivery</h3>
              <p className="text-sm text-gray-700">
                {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Location</h3>
              <p className="text-sm text-gray-700">{shipment.currentLocation || 'In Transit'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Tracking page error', err);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
        <p className="text-gray-600">Unable to load shipment information.</p>
      </div>
    );
  }
}


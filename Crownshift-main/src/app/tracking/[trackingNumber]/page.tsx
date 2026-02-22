"use client";
import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import ShipmentTimeline from '@/components/ShipmentTimeline';
import { Shipment } from '@/lib/firestore-models';

export default function TrackingLivePage({ params }: { params: { trackingNumber: string } }) {
  const trackingNumber = params.trackingNumber;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trackingNumber) return;

    const ref = doc(db, 'shipments', trackingNumber);
    setLoading(true);
    const unsub = onSnapshot(
      ref,
      (snap: DocumentSnapshot) => {
        if (!snap.exists()) {
          setShipment(null);
          setLoading(false);
          setError('Shipment not found');
          return;
        }

        const data = snap.data();
        // Avoid re-rendering identical payloads
        const updatedAt = (data?.updatedAt && (data.updatedAt as any).toDate ? (data.updatedAt as any).toDate().getTime() : null) || Date.now();
        if (lastUpdateRef.current && lastUpdateRef.current === updatedAt) {
          setLoading(false);
          return;
        }
        lastUpdateRef.current = updatedAt;

        setShipment({ id: snap.id, ...(data as any) } as Shipment);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime shipment error", err);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    return () => {
      // clean unsubscribe to avoid memory leaks
      unsub();
    };
  }, [trackingNumber]);

  if (loading) return <p>Loading live shipment...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!shipment) return <p>Shipment not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Live Tracking — {shipment.trackingNumber}</h1>
      <p className="text-sm text-gray-500">Status: {shipment.status}</p>
      <div className="mt-6">
        <ShipmentTimeline timeline={shipment.timeline} />
      </div>
    </div>
  );
}

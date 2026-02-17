"use client";
import React, { useEffect, useState, useRef } from 'react';
import { doc, getFirestore, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import ShipmentTimeline from '@/components/ShipmentTimeline';
import { Shipment } from '@/lib/firestore-models';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function TrackingLivePage({ params }: { params: { trackingNumber: string } }) {
  const trackingNumber = params.trackingNumber;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trackingNumber) return;

    // Initialize Firebase client only once in browser
    if (!getApps().length) {
      try {
        initializeApp(firebaseConfig);
      } catch (e) {
        console.warn("Firebase client init warning", e);
      }
    }

    const db = getFirestore();
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

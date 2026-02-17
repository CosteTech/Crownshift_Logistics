"use client";
import { useState } from "react";

export const metadata = {
  title: "Track Shipment — Crownshift Logistics",
  description: "Track your shipment by tracking number.",
};

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<any>(null);

  async function handleTrack() {
    if (!trackingNumber) return;
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(trackingNumber)}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: (e as Error).message });
    }
  }

  return (
    <div>
      <h1>Track a Shipment</h1>
      <input
        placeholder="Enter Tracking Number"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
      />
      <button onClick={handleTrack}>Track</button>

      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{result ? JSON.stringify(result, null, 2) : ""}</pre>
    </div>
  );
}
"use client";

import TrackingSection from "@/components/sections/tracking";
import AuthGuard from '@/components/AuthGuard';

export default function TrackingPage() {
  return (
    <AuthGuard>
      <TrackingSection />
    </AuthGuard>
  );
}

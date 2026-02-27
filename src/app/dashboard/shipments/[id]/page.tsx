export const runtime = "nodejs";

import React from "react";
import { redirect } from "next/navigation";
import ShipmentTimeline from "@/components/ShipmentTimeline";
import { apiFetchJson } from "@/lib/server/internal-api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return { title: `Shipment ${resolved.id} - Dashboard` };
}

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  try {
    const response = await apiFetchJson<{ shipment?: any; error?: string }>(
      `/api/dashboard/shipments/${resolved.id}`
    );

    if (response.status === 401) return redirect("/login");
    if (response.status === 403) return <div className="text-red-600">Forbidden</div>;
    if (response.status === 404) return <div>Shipment not found</div>;
    if (!response.ok || !response.data?.shipment) {
      return <div className="text-red-600">Unable to load shipment.</div>;
    }

    const shipment = response.data.shipment;

    return (
      <div>
        <h1 className="text-2xl font-semibold">Shipment {shipment.trackingNumber}</h1>
        <p className="text-sm text-gray-500">Status: {shipment.status}</p>
        <div className="mt-6">
          <ShipmentTimeline timeline={shipment.timeline} />
        </div>
      </div>
    );
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.error("Shipment detail error", err);
    return <div className="text-red-600">Unable to load shipment.</div>;
  }
}

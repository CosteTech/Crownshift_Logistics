export const runtime = "nodejs";

import React from "react";
import { redirect } from "next/navigation";
import ShipmentTimeline from "@/components/ShipmentTimeline";
import { apiFetchJson } from "@/lib/server/internal-api";
import { Shipment } from "@/lib/firestore-models";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const resolved = await params;
  const trackingPath = `/tracking/${resolved.trackingNumber}`;

  try {
    const response = await apiFetchJson<{ error?: string } | (Shipment & Record<string, unknown>)>(
      `/api/tracking/${resolved.trackingNumber}`
    );

    if (response.status === 401) {
      redirect(`/login?callbackUrl=${encodeURIComponent(trackingPath)}`);
    }

    if (response.status === 403) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to view this shipment.</p>
        </div>
      );
    }

    if (response.status === 404 || !response.ok || !response.data) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold mb-4">Shipment Not Found</h1>
          <p className="text-gray-600">
            No shipment found with tracking number:{" "}
            <code className="bg-gray-100 px-2 py-1">{resolved.trackingNumber}</code>
          </p>
        </div>
      );
    }

    const shipment = response.data as Shipment & {
      trackingNumber?: string;
      status?: string;
      origin?: string;
      destination?: string;
      estimatedDelivery?: string;
      currentLocation?: string;
      timeline?: unknown[];
    };

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
              <ShipmentTimeline timeline={shipment.timeline as any} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Origin</h3>
              <p className="text-sm text-gray-700">{shipment.origin || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Destination</h3>
              <p className="text-sm text-gray-700">{shipment.destination || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Estimated Delivery</h3>
              <p className="text-sm text-gray-700">
                {shipment.estimatedDelivery
                  ? new Date(shipment.estimatedDelivery).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Location</h3>
              <p className="text-sm text-gray-700">{shipment.currentLocation || "In Transit"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Tracking page error", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
        <p className="text-gray-600">Unable to load shipment information.</p>
      </div>
    );
  }
}

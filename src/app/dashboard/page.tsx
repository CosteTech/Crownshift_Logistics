export const runtime = "nodejs";

import React from "react";
import { redirect } from "next/navigation";
import { apiFetchJson } from "@/lib/server/internal-api";

export const metadata = {
  title: "Dashboard - Crownshift",
  description: "Your shipments and account overview",
};
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    const response = await apiFetchJson<{ shipments?: any[]; error?: string }>(
      "/api/dashboard/shipments"
    );
    if (response.status === 401) {
      return redirect("/login");
    }
    if (!response.ok) {
      return <div className="text-red-600">Unable to load dashboard.</div>;
    }

    const shipments = response.data?.shipments || [];

    return (
      <div>
        <h1 className="text-2xl font-semibold">My Shipments</h1>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipments.map((shipment: any) => (
            <div key={shipment.id} className="p-4 bg-white rounded shadow">
              <p className="text-sm text-gray-500">Tracking</p>
              <h3 className="font-medium">{shipment.trackingNumber}</h3>
              <p className="text-sm">Status: {shipment.status}</p>
              <p className="text-sm">
                ETA:{" "}
                {shipment.estimatedDelivery
                  ? new Date(shipment.estimatedDelivery).toLocaleString()
                  : "N/A"}
              </p>
              <a className="inline-block mt-3 text-blue-600" href={`/dashboard/shipments/${shipment.id}`}>
                View details
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Dashboard error", error);
    return <div className="text-red-600">Unable to load dashboard.</div>;
  }
}


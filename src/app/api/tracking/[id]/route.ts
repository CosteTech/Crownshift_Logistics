export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeShipment } from "@/lib/firestore-serializers";

/**
 * Server-side tracking lookup endpoint
 * @route GET /api/tracking/[id]
 * @access Private - requires valid company token
 * @security Enforces company isolation via requireCompanyFromRequest
 */
export async function GET(request: any, context: any) {
  const params = context?.params || {};
  try {
    const db = getFirestoreAdmin();
    const docRef = db.collection("shipments").doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const shipment = serializeShipment(snap.data(), snap.id) as any;

    // Require token company match shipment.companyId
    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      await requireCompanyFromRequest(request.headers, shipment.companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    return NextResponse.json(shipment);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unavailable" }, { status: 500 });
  }
}



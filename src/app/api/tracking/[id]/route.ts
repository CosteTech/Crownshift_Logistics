import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getFirestoreAdmin } from "@/firebase/server-init";

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

    // Require token company match shipment.companyId
    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      await requireCompanyFromRequest(request.headers, snap.data().companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    return NextResponse.json(snap.data());
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unavailable" }, { status: 500 });
  }
}

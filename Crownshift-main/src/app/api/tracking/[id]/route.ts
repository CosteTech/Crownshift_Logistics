import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Server-side tracking lookup using Admin Firestore if available.
// Tries to import getFirestoreAdmin from existing server-init; falls back to an error.
export async function GET(request: any, context: any) {
  const params = context?.params || {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getFirestoreAdmin } = require("@/firebase/server-init");
    if (!getFirestoreAdmin) throw new Error("server-init missing getFirestoreAdmin");

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

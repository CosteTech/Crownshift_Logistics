export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminAuth, getFirestoreAdmin, isAdminEmail } from "@/firebase/admin";
import { serializeShipment } from "@/lib/firestore-serializers";

/**
 * Server-side tracking lookup endpoint
 * @route GET /api/tracking/[id]
 * @access Private - requires session cookie or valid tenant token
 * @security Enforces ownership/admin or tenant company isolation
 */
export async function GET(request: any, context: any) {
  const params = (await context?.params) || {};
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    const db = getFirestoreAdmin();
    let snap = await db.collection("shipments").doc(id).get();
    if (!snap.exists) {
      const byTracking = await db
        .collection("shipments")
        .where("trackingNumber", "==", id)
        .limit(1)
        .get();
      if (!byTracking.empty) {
        snap = byTracking.docs[0];
      }
    }

    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const shipment = serializeShipment(snap.data(), snap.id) as {
      customerId?: string;
      companyId?: string;
    };

    const sessionCookie = request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)__session=([^;]+)/)?.[1];

    if (sessionCookie) {
      const auth = getAdminAuth();
      const decoded = await auth
        .verifySessionCookie(decodeURIComponent(sessionCookie), true)
        .catch(() => null);

      if (!decoded) {
        return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
      }

      const isOwner = decoded.uid === shipment.customerId;
      const isAdmin = isAdminEmail(decoded.email || null);
      const sameCompany =
        !shipment.companyId ||
        !decoded.companyId ||
        shipment.companyId === decoded.companyId;

      if (!isOwner && !(isAdmin && sameCompany)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      return NextResponse.json(shipment);
    }

    // Require token company match shipment.companyId
    try {
      const { requireCompanyFromRequest } = await import('@/lib/server/company-context');
      await requireCompanyFromRequest(request.headers, shipment.companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    return NextResponse.json(shipment);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unavailable" }, { status: 500 });
  }
}



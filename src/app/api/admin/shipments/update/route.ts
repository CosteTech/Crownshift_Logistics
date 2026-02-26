export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { requireAdminFromRequest } from "@/lib/server/admin-auth";

/**
 * Admin shipment update endpoint
 * @route POST /api/admin/shipments/update
 * @access Admin only
 * @security Requires valid admin token and company isolation verification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackingNumber, status, timelineEntry } = body;
    if (!trackingNumber) return NextResponse.json({ error: "missing trackingNumber" }, { status: 400 });

    const decoded = await requireAdminFromRequest(request);

    const db = getFirestoreAdmin();
    const docRef = db.collection("shipments").doc(trackingNumber);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Enforce company isolation for admin: admin must belong to same company as shipment
    const shipData = snap.data() as any;
    if (decoded.companyId && shipData.companyId && decoded.companyId !== shipData.companyId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const update: any = {};
    if (status) update.status = status;
    if (timelineEntry) update.timeline = (snap.data().timeline || []).concat([timelineEntry]);
    update.updatedAt = new Date();

    await docRef.update(update);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "server error";
    const status =
      message.includes("Missing authentication token") ||
      message.includes("Invalid token") ||
      message.includes("Insufficient privileges")
        ? 403
        : message.includes("ADMIN_EMAILS is not configured")
          ? 500
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}



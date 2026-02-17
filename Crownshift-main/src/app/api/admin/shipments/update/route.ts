import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackingNumber, status, timelineEntry } = body;
    if (!trackingNumber) return NextResponse.json({ error: "missing trackingNumber" }, { status: 400 });

    // Try to use server admin helper
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getFirestoreAdmin, verifyAdminToken } = require("@/firebase/server-init");
    if (!getFirestoreAdmin) throw new Error("Server admin not configured");

    const authHeader = (request as any).headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Verify token and admin claim
    const decoded = await verifyAdminToken(token).catch(() => null);
    if (!decoded) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const db = getFirestoreAdmin();
    const docRef = db.collection("shipments").doc(trackingNumber);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Enforce company isolation for admin: admin must belong to same company as shipment
    const shipData = snap.data() as any;
    if ((decoded as any).companyId && shipData.companyId && (decoded as any).companyId !== shipData.companyId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const update: any = {};
    if (status) update.status = status;
    if (timelineEntry) update.timeline = (snap.data().timeline || []).concat([timelineEntry]);
    update.updatedAt = new Date();

    await docRef.update(update);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}

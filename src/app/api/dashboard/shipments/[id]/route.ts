export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminAuth, getFirestoreAdmin, isAdminEmail } from "@/firebase/admin";
import { serializeShipment } from "@/lib/firestore-serializers";

function getSessionCookieValue(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const sessionCookie = getSessionCookieValue(request);
  if (!sessionCookie) {
    return NextResponse.json({ error: "Missing session cookie" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    const db = getFirestoreAdmin();
    const doc = await db.collection("shipments").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const shipment = doc.data() as { customerId?: string; companyId?: string };
    const isOwner = shipment?.customerId === decoded.uid;
    const isAdmin = isAdminEmail(decoded.email || null);
    const sameCompany =
      !shipment?.companyId ||
      !decoded.companyId ||
      shipment.companyId === decoded.companyId;

    if (!isOwner && !(isAdmin && sameCompany)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      shipment: serializeShipment(doc.data(), doc.id),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load shipment";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}


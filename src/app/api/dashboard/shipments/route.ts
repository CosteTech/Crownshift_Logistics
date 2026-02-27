export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminAuth, getFirestoreAdmin } from "@/firebase/admin";
import { serializeShipment } from "@/lib/firestore-serializers";

function getSessionCookieValue(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  const sessionCookie = getSessionCookieValue(request);
  if (!sessionCookie) {
    return NextResponse.json({ error: "Missing session cookie" }, { status: 401 });
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    const db = getFirestoreAdmin();
    const res = await db
      .collection("shipments")
      .where("customerId", "==", decoded.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const shipments = res.docs.map((doc) => serializeShipment(doc.data(), doc.id));

    return NextResponse.json({ success: true, shipments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load shipments";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}


export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeFirestoreDoc } from "@/lib/firestore-serializers";
import { requireAdminFromRequest } from "@/lib/server/admin-auth";

export async function GET(request: Request) {
  try {
    const decoded = await requireAdminFromRequest(request);
    const companyId = typeof decoded.companyId === "string" ? decoded.companyId : null;

    const db = getFirestoreAdmin();
    let query = db
      .collection("reviews")
      .where("status", "==", "pending");

    if (companyId) {
      query = query.where("companyId", "==", companyId);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const reviews = snapshot.docs.map((doc) => serializeFirestoreDoc(doc.data(), doc.id));
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pending reviews";
    const status =
      message.includes("Missing authentication token") || message.includes("Invalid") ? 401 :
      message.includes("Insufficient privileges") ? 403 :
      message.includes("ADMIN_EMAIL is not configured") ? 500 :
      500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

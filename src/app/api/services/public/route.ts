export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeService } from "@/lib/firestore-serializers";

export async function GET() {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection("services").get();
    const services = snapshot.docs
      .map((doc) => serializeService(doc.data(), doc.id))
      .filter((service) => (service as { isVisible?: boolean }).isVisible !== false);

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch services";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


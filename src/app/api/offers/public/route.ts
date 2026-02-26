export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeFirestoreDoc } from "@/lib/firestore-serializers";

export async function GET() {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection("offers").where("isActive", "==", true).get();
    const offers = snapshot.docs.map((doc) => serializeFirestoreDoc(doc.data(), doc.id));
    return NextResponse.json({ success: true, data: offers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch offers";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


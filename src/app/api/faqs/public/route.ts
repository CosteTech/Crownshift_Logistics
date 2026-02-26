export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeFAQ } from "@/lib/firestore-serializers";

export async function GET() {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection("faqs").orderBy("order").get();
    const faqs = snapshot.docs
      .map((doc) => serializeFAQ(doc.data(), doc.id))
      .filter((faq) => (faq as { isVisible?: boolean }).isVisible !== false);

    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch FAQs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeFAQ } from "@/lib/firestore-serializers";

function getAuthStatusCode(message: string) {
  if (message.includes("Missing authentication token") || message.includes("Invalid token")) {
    return 401;
  }
  if (message.includes("companyId mismatch") || message.includes("Token missing companyId claim")) {
    return 403;
  }
  return 500;
}

function makeSlug(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

export async function GET(request: Request) {
  try {
    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);

    const db = getFirestoreAdmin();
    const snapshot = await db
      .collection("faqs")
      .where("companyId", "==", companyId)
      .orderBy("order")
      .get();

    const faqs = snapshot.docs.map((doc) => {
      const data = doc.data();
      const faq = serializeFAQ(data, doc.id) as Record<string, unknown>;
      faq.isDefault = data.isDefault || false;
      faq.isVisible = data.isVisible !== false;
      return faq;
    });

    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch FAQs";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string; answer?: string };
    if (!body?.question || !body?.answer) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);

    const db = getFirestoreAdmin();
    const snapshot = await db
      .collection("faqs")
      .where("companyId", "==", companyId)
      .orderBy("order", "desc")
      .limit(1)
      .get();
    const maxOrder = snapshot.empty ? 0 : (snapshot.docs[0].data().order || 0);

    const docRef = await db.collection("faqs").add({
      question: body.question,
      answer: body.answer,
      slug: makeSlug(body.question),
      companyId,
      isDefault: false,
      isVisible: true,
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create FAQ";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}


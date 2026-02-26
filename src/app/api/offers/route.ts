export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeFirestoreDoc } from "@/lib/firestore-serializers";

function getAuthStatusCode(message: string) {
  if (message.includes("Missing authentication token") || message.includes("Invalid token")) {
    return 401;
  }
  if (message.includes("companyId mismatch") || message.includes("Token missing companyId claim")) {
    return 403;
  }
  return 500;
}

export async function GET(request: Request) {
  try {
    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);

    const db = getFirestoreAdmin();
    const snapshot = await db.collection("offers").where("companyId", "==", companyId).get();
    const offers = snapshot.docs.map((doc) => serializeFirestoreDoc(doc.data(), doc.id));
    return NextResponse.json({ success: true, data: offers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch offers";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      serviceId?: string;
      discountPercent?: number;
      description?: string;
      isActive?: boolean;
    };

    if (!body?.serviceId || typeof body.discountPercent !== "number" || !body.description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);

    const db = getFirestoreAdmin();
    const docRef = await db.collection("offers").add({
      serviceId: body.serviceId,
      discountPercent: body.discountPercent,
      description: body.description,
      isActive: body.isActive !== false,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create offer";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}


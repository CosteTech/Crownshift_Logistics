export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeService } from "@/lib/firestore-serializers";

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
    const snapshot = await db.collection("services").where("companyId", "==", companyId).get();
    const services = snapshot.docs.map((doc) => serializeService(doc.data(), doc.id));

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch services";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      price?: number;
      isFeatured?: boolean;
    };

    if (!body?.title || !body?.description || typeof body?.price !== "number") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);

    const db = getFirestoreAdmin();
    const docRef = await db.collection("services").add({
      title: body.title,
      description: body.description,
      price: body.price,
      isFeatured: Boolean(body.isFeatured),
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create service";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}


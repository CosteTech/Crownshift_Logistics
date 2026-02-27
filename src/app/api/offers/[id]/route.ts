export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";

function getAuthStatusCode(message: string) {
  if (message.includes("Missing authentication token") || message.includes("Invalid token")) {
    return 401;
  }
  if (message.includes("companyId mismatch") || message.includes("Token missing companyId claim")) {
    return 403;
  }
  return 500;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);
    const updates = (await request.json()) as Record<string, unknown>;

    const db = getFirestoreAdmin();
    const ref = db.collection("offers").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const offerData = snap.data() as { companyId?: string };
    if (offerData?.companyId !== companyId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await ref.update({
      ...updates,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update offer";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);

    const db = getFirestoreAdmin();
    const ref = db.collection("offers").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const offerData = snap.data() as { companyId?: string };
    if (offerData?.companyId !== companyId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete offer";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}


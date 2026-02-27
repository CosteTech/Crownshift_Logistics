export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { isFAQDeletable } from "@/lib/data-models";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);
    const updates = (await request.json()) as {
      question?: string;
      answer?: string;
      isVisible?: boolean;
      order?: number;
    };

    const db = getFirestoreAdmin();
    const ref = db.collection("faqs").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const faqData = snap.data() as { companyId?: string };
    if (faqData?.companyId !== companyId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const payload: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date(),
    };
    if (updates.question) {
      payload.slug = makeSlug(updates.question);
    }

    await ref.update(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update FAQ";
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

    if (!isFAQDeletable(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Default FAQs cannot be deleted. You can hide them or edit their content.",
        },
        { status: 400 }
      );
    }

    const { requireCompanyFromRequest } = await import("@/lib/server/company-context");
    const { companyId } = await requireCompanyFromRequest(request.headers);

    const db = getFirestoreAdmin();
    const ref = db.collection("faqs").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const faqData = snap.data() as { companyId?: string };
    if (faqData?.companyId !== companyId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete FAQ";
    return NextResponse.json({ success: false, error: message }, { status: getAuthStatusCode(message) });
  }
}


export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { requireAdminFromRequest } from "@/lib/server/admin-auth";

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    const decoded = await requireAdminFromRequest(request);
    const companyId = typeof decoded.companyId === "string" ? decoded.companyId : null;
    const db = getFirestoreAdmin();

    const usersQuery = companyId
      ? db.collection("users").where("companyId", "==", companyId)
      : db.collection("users");
    const bookingsQuery = companyId
      ? db.collection("bookings").where("companyId", "==", companyId)
      : db.collection("bookings");
    const pendingReviewsQuery = companyId
      ? db.collection("reviews").where("companyId", "==", companyId).where("status", "==", "pending")
      : db.collection("reviews").where("status", "==", "pending");

    const [usersSnapshot, bookingsSnapshot, pendingReviewsSnapshot] = await Promise.all([
      usersQuery.get(),
      bookingsQuery.get(),
      pendingReviewsQuery.get(),
    ]);

    const uniqueCustomerEmails = new Set<string>();
    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data() as { email?: string; userEmail?: string };
      const email = normalizeEmail(data.email || data.userEmail || null);
      if (email) {
        uniqueCustomerEmails.add(email);
      }
    });

    return NextResponse.json({
      success: true,
      totalCustomers: uniqueCustomerEmails.size,
      totalBookings: bookingsSnapshot.size,
      pendingReviews: pendingReviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch admin stats";
    const status =
      message.includes("Missing authentication token") || message.includes("Invalid") ? 403 :
      message.includes("Insufficient privileges") ? 403 :
      message.includes("ADMIN_EMAILS is not configured") ? 500 :
      500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

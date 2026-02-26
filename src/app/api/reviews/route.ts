export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/firebase/admin";
import { serializeFirestoreDoc } from "@/lib/firestore-serializers";

export async function GET() {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection("reviews").where("status", "==", "approved").get();
    const reviews = snapshot.docs.map((doc) => serializeFirestoreDoc(doc.data(), doc.id));
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reviews";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      userName?: string;
      rating?: number;
      comment?: string;
      serviceId?: string;
    };

    if (!body.userId || !body.serviceId || !body.userName || !body.comment || !body.rating) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { getAuthFromRequest } = await import("@/lib/server/company-context");
    const { decoded } = await getAuthFromRequest(request.headers);
    if (!decoded || decoded.uid !== body.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const db = getFirestoreAdmin();
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("userId", "==", body.userId)
      .where("serviceId", "==", body.serviceId)
      .where("status", "==", "completed")
      .get();

    if (bookingsSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "You must have completed this service to leave a review",
        },
        { status: 400 }
      );
    }

    const docRef = await db.collection("reviews").add({
      userId: body.userId,
      userName: body.userName,
      rating: body.rating,
      comment: body.comment,
      serviceId: body.serviceId,
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    const status =
      message.includes("Missing authentication token") || message.includes("Invalid token") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}


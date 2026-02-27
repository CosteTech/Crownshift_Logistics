export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/firebase/admin";
import { requireAdminFromRequest } from "@/lib/server/admin-auth";

type VerifyAdminSuccess = {
  ok: true;
  uid: string;
  email: string | null;
  displayName: string;
  companyId: string | null;
};

function getDisplayName(email: string | null, fallbackName?: string | null) {
  if (fallbackName) {
    return fallbackName;
  }
  if (!email) {
    return "Admin";
  }

  const emailName = email.split("@")[0];
  return emailName.charAt(0).toUpperCase() + emailName.slice(1);
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireAdminFromRequest(request);
    const auth = getAdminAuth();
    const user = await auth.getUser(decoded.uid);
    const payload: VerifyAdminSuccess = {
      ok: true,
      uid: decoded.uid,
      email: user.email ?? decoded.email ?? null,
      displayName: getDisplayName(user.email ?? decoded.email ?? null, user.displayName ?? null),
      companyId: typeof decoded.companyId === "string" ? decoded.companyId : null,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Admin verify failed:", error);
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status =
      message.includes("Missing authentication token") ||
      message.includes("Invalid token") ||
      message.includes("Insufficient privileges")
        ? 403
        : message.includes("ADMIN_EMAILS is not configured")
          ? 500
          : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

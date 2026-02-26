export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/firebase/admin";
import { requireAdminFromSessionCookie } from "@/lib/server/admin-auth";

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
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ ok: false, error: "Missing session cookie" }, { status: 401 });
  }

  if (!process.env.ADMIN_EMAIL) {
    return NextResponse.json({ ok: false, error: "ADMIN_EMAIL is not configured" }, { status: 500 });
  }

  try {
    const decoded = await requireAdminFromSessionCookie(sessionCookie);
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
    return NextResponse.json({ ok: false, error: "Invalid or expired session" }, { status: 401 });
  }
}

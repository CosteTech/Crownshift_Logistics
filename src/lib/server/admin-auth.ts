import "server-only";

import { getAdminAuth, isAdminEmail } from "@/firebase/admin";

type DecodedAdminToken = {
  uid: string;
  email?: string | null;
  companyId?: string;
};

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

function requireConfiguredAdminEmail() {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not configured");
  }
  return adminEmail;
}

export function extractBearerTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

export async function requireAdminFromIdToken(idToken: string): Promise<DecodedAdminToken> {
  requireConfiguredAdminEmail();
  const auth = getAdminAuth();
  const decoded = (await auth.verifyIdToken(idToken).catch(() => {
    throw new Error("Invalid token");
  })) as DecodedAdminToken;

  if (!isAdminEmail(decoded.email || null)) {
    throw new Error("Insufficient privileges");
  }

  return decoded;
}

export async function requireAdminFromSessionCookie(sessionCookie: string): Promise<DecodedAdminToken> {
  requireConfiguredAdminEmail();
  const auth = getAdminAuth();
  const decoded = (await auth.verifySessionCookie(sessionCookie, true).catch(() => {
    throw new Error("Invalid or expired session");
  })) as DecodedAdminToken;

  if (!isAdminEmail(decoded.email || null)) {
    throw new Error("Insufficient privileges");
  }

  return decoded;
}

export async function requireAdminFromRequest(request: Request): Promise<DecodedAdminToken> {
  const bearerToken = extractBearerTokenFromRequest(request);
  if (bearerToken) {
    return requireAdminFromIdToken(bearerToken);
  }

  const sessionCookie = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)__session=([^;]+)/)?.[1];
  if (sessionCookie) {
    return requireAdminFromSessionCookie(decodeURIComponent(sessionCookie));
  }

  throw new Error("Missing authentication token");
}


import "server-only";

import { getAdminAuth } from "@/firebase/admin";

type DecodedAdminToken = {
  uid: string;
  email?: string | null;
  companyId?: string;
};

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

function parseAdminEmails(raw: string | null | undefined) {
  return (raw || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function getConfiguredAdminEmails() {
  const configuredEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (configuredEmails.length > 0) {
    return configuredEmails;
  }

  const legacyAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  return legacyAdminEmail ? [legacyAdminEmail] : [];
}

function requireConfiguredAdminEmails() {
  const configuredEmails = getConfiguredAdminEmails();
  if (configuredEmails.length === 0) {
    throw new Error("ADMIN_EMAILS is not configured");
  }
  return configuredEmails;
}

export function isAdmin(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  return getConfiguredAdminEmails().includes(normalizedEmail);
}

export function extractBearerTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

export async function requireAdminFromIdToken(idToken: string): Promise<DecodedAdminToken> {
  requireConfiguredAdminEmails();
  const auth = getAdminAuth();
  const decoded = (await auth.verifyIdToken(idToken).catch(() =>{
  })) as DecodedAdminToken;

  if (!isAdmin(decoded.email || null)) {
    throw new Error("Insufficient privileges");
  }

  return decoded;
}

export async function requireAdminFromRequest(request: Request): Promise<DecodedAdminToken> {
  const bearerToken = extractBearerTokenFromRequest(request);
  if (!bearerToken) {
    throw new Error("Missing authentication token");
  }

  return requireAdminFromIdToken(bearerToken);
}

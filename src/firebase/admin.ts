import "server-only";
import * as admin from "firebase-admin";

const requiredEnvVars = {
  FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
};

if (process.env.NODE_ENV === "production") {
  const missing = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missing.join(", ")}`
    );
  }
}

const adminConfig: admin.ServiceAccount = {
  projectId: requiredEnvVars.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: requiredEnvVars.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: requiredEnvVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

function hasServiceAccountConfig() {
  return Boolean(adminConfig.projectId && adminConfig.clientEmail && adminConfig.privateKey);
}

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (!hasServiceAccountConfig()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firebase Admin service account is incomplete; using application default credentials.");
    } else {
      throw new Error("Firebase Admin configuration is incomplete");
    }
  }

  return admin.initializeApp({
    credential: hasServiceAccountConfig()
      ? admin.credential.cert(adminConfig)
      : admin.credential.applicationDefault(),
  });
}

export function getFirestoreAdmin() {
  return admin.firestore(getAdminApp());
}

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}

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

// Legacy single-admin accessor kept for compatibility with older call sites.
export function getConfiguredAdminEmail() {
  return getConfiguredAdminEmails()[0] || "";
}

export function isAdminEmail(email: string | null | undefined) {
  const configuredAdminEmails = getConfiguredAdminEmails();
  if (configuredAdminEmails.length === 0) {
    return false;
  }
  return configuredAdminEmails.includes(normalizeEmail(email));
}

export async function verifyAdminToken(idToken: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken).catch(() => {
    throw new Error("Invalid token");
  });

  if (getConfiguredAdminEmails().length === 0) {
    throw new Error("ADMIN_EMAILS is not configured");
  }

  if (decoded && isAdminEmail(decoded.email || null)) {
    return decoded;
  }

  throw new Error("Insufficient privileges");
}

export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken).catch(() => {
    throw new Error("Invalid token");
  });
  return decoded;
}

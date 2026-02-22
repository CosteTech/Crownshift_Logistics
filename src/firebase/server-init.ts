
import * as admin from 'firebase-admin';

// Validate required server-side environment variables
const requiredEnvVars = {
  'FIREBASE_ADMIN_PROJECT_ID': process.env.FIREBASE_ADMIN_PROJECT_ID,
  'FIREBASE_ADMIN_CLIENT_EMAIL': process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  'FIREBASE_ADMIN_PRIVATE_KEY': process.env.FIREBASE_ADMIN_PRIVATE_KEY,
};

// Check for missing variables in production
if (process.env.NODE_ENV === 'production') {
  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    throw new Error(`❌ Missing required Firebase Admin environment variables: ${missing.join(', ')}`);
  }
}

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // This fix handles both quoted and unquoted keys with newlines
  privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined,
};

export function getAdminApp() {
  if (!admin.apps.length) {
    // Log warnings in development if variables are missing
    if (!adminConfig.projectId || !adminConfig.privateKey || !adminConfig.clientEmail) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Firebase Admin variables are missing or incomplete!');
        console.warn('  - projectId:', adminConfig.projectId ? '✓' : '✗ MISSING');
        console.warn('  - clientEmail:', adminConfig.clientEmail ? '✓' : '✗ MISSING');
        console.warn('  - privateKey:', adminConfig.privateKey ? '✓' : '✗ MISSING');
      } else {
        throw new Error('Firebase Admin configuration is incomplete');
      }
    }

    return admin.initializeApp({
      credential: adminConfig.privateKey && adminConfig.clientEmail && adminConfig.projectId 
        ? admin.credential.cert(adminConfig as any)
        : admin.credential.applicationDefault(),
    });
  }
  return admin.app();
}

export function getFirestoreAdmin() {
  const app = getAdminApp();
  return admin.firestore(app);
}

export function getAdminAuth() {
  const app = getAdminApp();
  return admin.auth(app);
}

export async function verifyAdminToken(idToken: string) {
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken).catch((err) => {
    throw new Error('Invalid token');
  });
  // Admin must be verified by UID only, not by role claim
  if (decoded && decoded.uid === ADMIN_UID) return decoded;
  throw new Error('Insufficient privileges');
}

export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken).catch((err) => {
    throw new Error('Invalid token');
  });
  return decoded;
}

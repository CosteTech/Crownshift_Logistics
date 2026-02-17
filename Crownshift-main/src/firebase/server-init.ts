
import * as admin from 'firebase-admin';

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // This fix handles both quoted and unquoted keys with newlines
  privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined,
};

export function getAdminApp() {
  if (!admin.apps.length) {
    // Log a warning ONLY in development if variables are missing
    if (!adminConfig.projectId || !adminConfig.privateKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Firebase Admin variables are missing!');
      }
    }

    return admin.initializeApp({
      credential: admin.credential.cert(adminConfig),
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
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken).catch((err) => {
    throw new Error('Invalid token');
  });
  if (decoded && decoded.role === 'admin') return decoded;
  throw new Error('Insufficient privileges');
}

export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken).catch((err) => {
    throw new Error('Invalid token');
  });
  return decoded;
}

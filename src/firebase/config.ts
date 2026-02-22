// Firebase client configuration
// All keys are prefixed with NEXT_PUBLIC_ to be exposed to the browser
// See `.env.local` for the required variables. This keeps secrets out of source control.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase configuration
if (!firebaseConfig.apiKey) {
  console.error("❌ Firebase API Key is missing! Check environment variables: NEXT_PUBLIC_FIREBASE_API_KEY");
}
if (!firebaseConfig.projectId) {
  console.error("❌ Firebase Project ID is missing! Check environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID");
}

// Admin UID for dashboard access control
export const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

// Initialize Firebase (Singleton pattern to prevent re-initialization)
// Try Firebase App Hosting first, fall back to config
let _firebaseApp: any;

// Initialize Firebase using the explicit config when no app exists.
// This prevents creating an app with empty/undefined config which
// can happen if environment variables are malformed.
if (getApps().length === 0) {
  _firebaseApp = initializeApp(firebaseConfig);
} else {
  _firebaseApp = getApp();
}

export const firebaseApp = _firebaseApp;

// Initialize and Export services
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

'use client';

// This file re-exports Firebase services from the centralized config
// to maintain backward compatibility with existing imports

import { getFirestore } from 'firebase/firestore';
import { firebaseApp, auth, ADMIN_UID, firebaseConfig } from './client';

export {
  firebaseConfig,
  firebaseApp,
  auth,
  ADMIN_UID
};

// Re-export db as both db and firestore for compatibility
export const db = getFirestore(firebaseApp);
export const firestore = db;

/**
 * Client-side Firebase initialization
 * Returns the initialized Firebase services (app, auth, firestore)
 * This is called once per client component mount to ensure services are available
 */
export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

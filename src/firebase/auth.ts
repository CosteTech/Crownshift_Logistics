'use client';

import { getAuth } from 'firebase/auth';
import { getSdks } from '@/firebase';

/**
 * Get the Firebase Auth instance on the client side
 * This should be called after Firebase is initialized in the app
 */
export const getClientAuth = () => {
  const { auth } = getSdks(getSdks(undefined as any).firebaseApp);
  return auth;
};

// Initialize and export auth for immediate use
let cachedAuth: any = null;

export function getAuth_Client() {
  if (!cachedAuth) {
    try {
      const { auth } = getSdks(undefined as any);
      cachedAuth = getAuth();
    } catch (error) {
      console.error('Failed to get auth:', error);
    }
  }
  return cachedAuth;
}

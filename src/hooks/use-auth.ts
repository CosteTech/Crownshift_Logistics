'use client';

import { useContext } from 'react';
import { FirebaseContext } from '@/firebase/provider';

/**
 * Custom hook to access the current authenticated user and auth loading state
 * @returns Object containing user, isLoading, and error
 */
export function useAuth() {
  const context = useContext(FirebaseContext);

  if (!context) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }

  return {
    user: context.user,
    isLoading: context.isUserLoading,
    error: context.userError,
  };
}

"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  isAdmin?: boolean;
}

const AuthGuard = ({ children, isAdmin = false }: AuthGuardProps) => {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = await user?.getIdToken();
        if (!token) {
          router.replace('/');
          return;
        }
        const response = await fetch('/api/admin/verify', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
    };

    // 1. Wait until the initial loading check is complete
    if (loading) return;

    // 2. If the user is NOT authenticated, redirect them to login
    if (!user) {
      // Get the current path to redirect back after successful login
      const currentPath = window.location.pathname;

      // Redirect with a callbackUrl query parameter
      router.replace(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    // 3. If admin access is required, check server-side protected admin endpoint
    if (isAdmin) {
      void verifyAdmin();
    }
  }, [user, loading, router, isAdmin]);

  // 3. If loading, show a simple spinner/message
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading authentication status...</div>;
  }

  // 4. If the user IS authenticated, render the protected content
  if (user) {
    return <>{children}</>;
  }

  // 5. Fallback: Render nothing if not loaded or not logged in (to prevent flicker)
  return null;
};

export default AuthGuard;

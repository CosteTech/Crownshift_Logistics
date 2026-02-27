'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AccessDeniedToastProps {
  show: boolean;
  message?: string;
}

/**
 * Toast-based access denial component
 * Replaces the standalone unauthorized page for better UX
 * Shows a toast notification and redirects after a brief delay
 */
export function AccessDeniedToast({
  show,
  message = 'You do not have permission to access this page.',
}: AccessDeniedToastProps) {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (show) {
      toast({
        title: 'Access Denied',
        description: message,
        variant: 'destructive',
      });
      // Redirect after 2 seconds to allow user to see the toast
      const timeout = setTimeout(() => router.push('/'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [show, message, toast, router]);

  return null;
}

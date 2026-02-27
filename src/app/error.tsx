'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  // Generate unique error ID for support reference
  const errorId = React.useMemo(() => 
    Math.random().toString(36).substr(2, 9).toUpperCase(),
    []
  );
  
  // Log to Sentry if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__SENTRY__) {
      try {
        const Sentry = window.__SENTRY__;
        if (Sentry.captureException) {
          Sentry.captureException(error, { tags: { errorId } });
        }
      } catch (e) {
        // Sentry error logging failed, continue
      }
    }
    
    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error boundary caught:', error);
    }
  }, [error, errorId]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-xl text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-2">
            Error ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{errorId}</code>
          </p>
          <p className="text-muted-foreground mb-6">Please provide this error ID to our support team.</p>
          <div className="space-x-3">
            <button 
              onClick={() => reset()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>
            <Link 
              href={`/support?errorId=${errorId}`}
              className="inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Report issue
            </Link>
            <Link 
              href="/" 
              className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

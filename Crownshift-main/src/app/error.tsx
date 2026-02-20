'use client';

import React from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('Global error boundary caught:', error);
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-xl text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">An unexpected error occurred. Our team has been notified.</p>
          <div className="space-x-3">
            <button onClick={() => reset()} className="btn">Try again</button>
            <Link href="/" className="btn-secondary">Go home</Link>
          </div>
        </div>
      </body>
    </html>
  );
}

import React, { Suspense } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/lib/context/AuthContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <FirebaseClientProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-[100dvh]">
              <Header />
              <main className="flex-1">
                <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                  {children}
                </Suspense>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

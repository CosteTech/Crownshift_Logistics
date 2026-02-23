'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Chrome } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { auth } = initializeFirebase();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(callbackUrl);
    }
  }, [user, isLoading, router, callbackUrl]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center">
        Redirecting...
      </div>
    );
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get the ID token and send it to the server to create a session cookie
      const idToken = await user.getIdToken();
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionRes.ok) {
        throw new Error('Failed to create session');
      }

      toast({
        title: 'Success',
        description: 'Admin login successful',
      });
      router.replace(callbackUrl);
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: 'Error',
        description: authError.message || 'Admin authentication failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Get the ID token and send it to the server to create a session cookie
      const idToken = await user.getIdToken();
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionRes.ok) {
        throw new Error('Failed to create session');
      }

      toast({
        title: 'Success',
        description: 'Signed in with Google',
      });
      router.replace(callbackUrl);
    } catch (error) {
      const authError = error as any;
      toast({
        title: 'Error',
        description: authError?.message || 'Google sign-in failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Secure admin access. Server-side UID validation required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            Not an admin?{' '}
            <Link href="/login" className="underline hover:text-foreground">
              User login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AuthError,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Apple, Chrome, Lock, Mail, Mail as MailIcon } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const isAdminLogin = pathname.includes('/admin');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const { auth } = initializeFirebase();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(callbackUrl);
    }
  }, [user, isLoading, router, callbackUrl]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <div className="flex h-screen items-center justify-center">Redirecting...</div>;
  }

  const createServerSession = async (idToken: string) => {
    const sessionRes = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!sessionRes.ok) {
      throw new Error('Failed to create session');
    }
  };

  const createUserProfile = async (
    payload: { userId: string; email: string | null; fullName?: string },
    idToken: string
  ) => {
    try {
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('Failed to create user profile:', await response.text());
      }
    } catch (err) {
      console.warn('Error creating user profile:', err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Success', description: 'Logged in successfully' });
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Success', description: 'Account created successfully' });
      }

      const idToken = await userCredential.user.getIdToken();
      await createServerSession(idToken);

      if (!isLogin) {
        await createUserProfile(
          {
            userId: userCredential.user.uid,
            email,
            fullName,
          },
          idToken
        );
      }

      router.replace(callbackUrl);
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'Invalid credentials. Please try again.';

      if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again in 15 minutes.';
      } else if (authError.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (authError.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      toast({
        title: 'Error',
        description: errorMessage,
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
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await createServerSession(idToken);
      await createUserProfile(
        {
          userId: result.user.uid,
          email: result.user.email,
          fullName: result.user.displayName || '',
        },
        idToken
      );

      toast({ title: 'Success', description: 'Signed in with Google' });
      router.replace(callbackUrl);
    } catch (error: any) {
      if (
        error?.code === 'auth/account-exists-with-different-credential' ||
        error?.code === 'auth/email-already-in-use'
      ) {
        const conflictingEmail = error?.customData?.email || error?.email || null;
        if (conflictingEmail) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, conflictingEmail);
            const pendingCred = GoogleAuthProvider.credentialFromError(error) as any;

            if (methods.includes('password') && pendingCred) {
              const pwd = window.prompt(
                `An account for ${conflictingEmail} already exists. Enter your password to sign in and link Google to your account.`
              );
              if (!pwd) {
                toast({
                  title: 'Cancelled',
                  description: 'Linking cancelled. Please sign in with your original method.',
                  variant: 'destructive',
                });
              } else {
                try {
                  const userCred = await signInWithEmailAndPassword(auth, conflictingEmail, pwd);
                  await linkWithCredential(userCred.user, pendingCred);
                  toast({
                    title: 'Linked',
                    description: 'Google account linked successfully. You can now sign in with Google.',
                  });
                  router.push(callbackUrl);
                } catch {
                  toast({
                    title: 'Error linking',
                    description: 'Failed to link accounts. Please try signing in with your original method.',
                    variant: 'destructive',
                  });
                }
              }
            } else {
              const primary = methods.length > 0 ? methods[0] : 'your original sign-in method';
              toast({
                title: 'Account Exists',
                description: `An account already exists for ${conflictingEmail}. Sign in with ${primary} and then link Google from your account settings.`,
                variant: 'destructive',
              });
            }
          } catch {
            toast({
              title: 'Error',
              description: 'An account with this email already exists. Please sign in with your original method.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Error',
            description: 'An account with this email already exists. Please sign in with your original method.',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Google sign-in error:', error?.code);
        toast({
          title: 'Error',
          description: 'Sign-in failed. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'microsoft' | 'apple') => {
    setLoading(true);
    try {
      console.warn(`${provider} OAuth not yet implemented. Please use Email or Google sign-in.`);
      toast({
        title: 'Coming Soon',
        description: `${provider} sign-in will be available soon. Please use Email or Google for now.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin
            ? 'Sign in to access our logistics services'
            : 'Create an account to get started with our services'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="pl-10"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="********"
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
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        {!isAdminLogin && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleOAuthSignIn('microsoft')}
                className="w-full"
              >
                <MailIcon className="mr-2 h-4 w-4" />
                Outlook
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleOAuthSignIn('apple')}
                className="w-full"
              >
                <Apple className="mr-2 h-4 w-4" />
                Apple
              </Button>
            </div>
          </>
        )}

        {!isAdminLogin && (
          <div className="text-center text-sm">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            Back to Home
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

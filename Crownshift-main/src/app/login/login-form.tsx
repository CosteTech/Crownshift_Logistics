'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  GoogleAuthProvider,
  AuthError,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Chrome, Apple, Mail as MailIcon } from 'lucide-react';
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
  const [role, setRole] = useState<'client' | 'admin'>('client');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize Firebase to get auth instance
  const { auth } = initializeFirebase();

  // Redirect if already logged in — only redirect when auth loading is complete AND user exists
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
        
        // Create user profile in Firestore
        try {
          const response = await fetch('/api/auth/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userCredential.user.uid,
              email,
              fullName,
              role: isAdminLogin ? 'admin' : role,
              company,
            }),
          });
          
          if (!response.ok) {
            console.warn('Failed to create user profile:', await response.text());
          }
        } catch (profileErr) {
          console.warn('Error creating user profile:', profileErr);
        }
      }
      // Redirect after successful auth
      router.replace(callbackUrl);
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: 'Error',
        description: authError.message || 'Authentication failed',
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
      toast({
        title: 'Success',
        description: 'Signed in with Google',
      });
      
      // Create/update user profile
      try {
        await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName || '',
            role: 'client',
            company: '',
          }),
        });
      } catch (err) {
        console.warn('Failed to create user profile:', err);
      }
      
      router.replace(callbackUrl);
    } catch (error) {
      const authError = error as any;

      // Handle common case where the email is already in use or
      // an account exists with a different credential/provider.
      if (
        authError?.code === 'auth/account-exists-with-different-credential' ||
        authError?.code === 'auth/email-already-in-use'
      ) {
        const conflictingEmail = authError?.customData?.email || authError?.email || null;
        if (conflictingEmail) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, conflictingEmail);

            // Try automatic linking if the existing account uses email/password
            const pendingCred = GoogleAuthProvider.credentialFromError(authError) as any;
            if (methods.includes('password') && pendingCred) {
              // Prompt the user for their password to re-authenticate
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
                } catch (linkErr) {
                  toast({
                    title: 'Error linking',
                    description: (linkErr as any)?.message || 'Failed to link accounts. Please try signing in with your original method.',
                    variant: 'destructive',
                  });
                }
              }
            } else {
              const primary = methods && methods.length > 0 ? methods[0] : 'your original sign-in method';
              toast({
                title: 'Account Exists',
                description: `An account already exists for ${conflictingEmail}. Sign in with ${primary} and then link Google from your account settings.`,
                variant: 'destructive',
              });
            }
          } catch (e) {
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
        toast({
          title: 'Error',
          description: authError?.message || 'Google sign-in failed',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedLogin = (platform: string) => {
    alert(`Simulating ${platform} Login...`);
    // Simulate successful login with demo user
    toast({
      title: 'Demo Login',
      description: `${platform} login simulated successfully`,
    });
    // In a real app, this would authenticate the user
    setTimeout(() => {
      router.replace(callbackUrl);
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {isAdminLogin ? 'Admin Sign In' : (isLogin ? 'Welcome Back' : 'Create Account')}
        </CardTitle>
        <CardDescription className="text-center">
          {isAdminLogin
            ? 'Sign in to the admin dashboard'
            : (isLogin
              ? 'Sign in to your account to continue'
              : 'Create an account to get started')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Email/Password Form */}
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
            <>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'client' | 'admin')}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company (Optional)</label>
                <Input
                  type="text"
                  placeholder="Your company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

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

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
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

            {/* Social Auth Buttons */}
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
                onClick={() => handleSimulatedLogin('Microsoft')}
                className="w-full"
              >
                <MailIcon className="mr-2 h-4 w-4" />
                Outlook
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleSimulatedLogin('Apple')}
                className="w-full"
              >
                <Apple className="mr-2 h-4 w-4" />
                Apple
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleSimulatedLogin('Yahoo')}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Yahoo
              </Button>
            </div>
          </>
        )}

        {/* Toggle Auth Mode - Hidden for Admin Login */}
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

        {/* Links */}
        <div className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            Back to Home
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

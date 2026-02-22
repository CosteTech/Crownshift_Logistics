"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import Logo from "./logo";
import { useAuth } from '@/hooks/use-auth';
import { initializeFirebase } from '@/firebase';
import { useState } from 'react';

export default function Header() {
  const sheetId = React.useId();
  const { user, isLoading: loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const unauthLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'FAQ', href: '/faq' },
  ];

  const authLinks = [
    { name: '', href: '' },
    { name: 'Track', href: '/tracking' },
    { name: 'Offers', href: '/offers' },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const sdks = initializeFirebase();
      await sdks.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out failed', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const linksToShow = user ? [...unauthLinks, ...authLinks] : unauthLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo className="h-10 w-10 text-primary" />
          <span className="hidden font-bold sm:inline-block font-headline">
            Crownshift Logistics LTD
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {linksToShow.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link
            href="/#quote"
            className="hidden md:inline-flex"
          >
             <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Get an Instant Quote
            </Button>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {!user && !loading && (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )}

            {user && (
              <Button onClick={handleSignOut} disabled={isSigningOut} variant="ghost">
                {isSigningOut ? 'Signing out...' : 'Logout'}
              </Button>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild aria-controls={`sheet-${sheetId}`}>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" id={`sheet-${sheetId}`}>
              <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                <Logo className="h-10 w-10 text-primary" />
                <span className="font-bold font-headline">Crownshift</span>
              </Link>
              <div className="flex flex-col space-y-4">
                {linksToShow.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                   <Link href="/#quote">
                      <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">Get a Quote</Button>
                    </Link>
                </SheetClose>
                <div>
                  {!user && !loading && (
                    <SheetClose asChild>
                      <Link href="/login" className="text-lg font-medium">Login</Link>
                    </SheetClose>
                  )}
                  {user && (
                    <Button onClick={handleSignOut} variant="ghost" className="w-full">Logout</Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

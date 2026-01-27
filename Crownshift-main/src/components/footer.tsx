"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import Logo from "./logo";
import { Button } from "./ui/button";
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

type ServiceItem = { title: string; slug: string };

export default function Footer() {
  const [services, setServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const sdks = initializeFirebase();
        const db = sdks.firestore;
        const snap = await getDocs(collection(db as any, 'services'));
        const items = snap.docs.map(d => ({ title: (d.data() as any).title || d.id, slug: d.id }));
        if (mounted) setServices(items);
      } catch (err) {
        console.warn('Could not fetch services from Firestore, using mock data:', err);
        if (mounted) setServices([
          { title: 'Local Express', slug: 'local-express' },
          { title: 'International Air Freight', slug: 'air-freight' },
          { title: 'Warehousing', slug: 'warehousing' },
        ]);
      }
    }

    load();
    return () => { mounted = false };
  }, []);

  return (
    <footer className="bg-card text-secondary-foreground border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 flex flex-col items-start">
             <Link href="/" className="flex items-center space-x-2">
                <Logo className="h-10 w-10 text-primary" />
                <span className="font-bold text-lg font-headline">Crownshift Logistics LTD</span>
             </Link>
             <p className="mt-4 text-sm text-muted-foreground">
                Reliable and efficient logistics solutions for your business.
             </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 md:col-span-3 gap-8">
            <div>
              <h3 className="font-headline font-semibold">Services</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {services.map(s => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="text-muted-foreground hover:text-primary">{s.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-headline font-semibold">Quick Links</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/#quote" className="text-muted-foreground hover:text-primary">Get a Quote</Link></li>
                <li><Link href="/client/tracking" className="text-muted-foreground hover:text-primary">Track Shipment</Link></li>
                <li><Link href="/client/faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-headline font-semibold">Follow Us</h3>
              <div className="flex mt-4 space-x-2">
               <div className="flex gap-2">
  <Button variant="ghost" size="icon" asChild>
    <Link href="#" aria-label="Instagram">
      <img src="/icons/Instagram.svg" className="h-5 w-5" alt="Instagram" />
      <span className="sr-only">Instagram</span>
    </Link>
  </Button>

  <Button variant="ghost" size="icon" asChild>
    <Link href="#" aria-label="Facebook">
      <img src="/icons/Facebook.svg" className="h-5 w-5" alt="Facebook" />
      <span className="sr-only">Facebook</span>
    </Link>
  </Button>

  <Button variant="ghost" size="icon" asChild>
    <Link href="#" aria-label="LinkedIn">
      <img src="/icons/Linkedin.svg" className="h-5 w-5" alt="LinkedIn" />
      <span className="sr-only">LinkedIn</span>
    </Link>
  </Button>

  <Button variant="ghost" size="icon" asChild>
    <Link href="#" aria-label="X">
      <img src="/icons/X.svg" className="h-5 w-5" alt="X" />
      <span className="sr-only">X</span>
    </Link>
  </Button>

  <Button variant="ghost" size="icon" asChild>
    <Link href="#" aria-label="WhatsApp">
      <img src="/icons/Whatsapp.svg" className="h-5 w-5" alt="WhatsApp" />
      <span className="sr-only">WhatsApp</span>
    </Link>
  </Button>

  <Button variant="ghost" size="icon" asChild>
    <Link href="#" aria-label="Tiktok">
      <img src="/icons/tiktok.svg" className="h-5 w-5" alt="TikTok" />
      <span className="sr-only">TikTok</span>
    </Link>
  </Button>
</div>

            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Crownshift Logistics LTD. All rights reserved.
            <Link 
              href="/login?callbackUrl=%2Fadmin" 
              className="text-inherit hover:text-inherit no-underline cursor-pointer group"
              title="Admin Portal"
            >
              <span className="invisible group-hover:visible text-xs ml-1 text-slate-400">[admin]</span>
            </Link>
          </p>
        </div>
      </div>
      </div>
    </footer>
  );
}

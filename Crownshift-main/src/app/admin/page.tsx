import React from "react";
import SeedControl from "@/components/admin/SeedControl";

export const metadata = {
  title: "Admin Dashboard — Crownshift Logistics",
};

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <section>
        <h2>Deployment / Data</h2>
        <SeedControl />
      </section>
    </div>
  );
}
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTotalCustomers, getTotalBookings, getPendingReviews } from '@/app/actions';
import { getAdminAuth } from '@/firebase/server-init';
import { ADMIN_UID } from '@/firebase/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Star } from 'lucide-react';
import ServicesForm from '@/components/admin/services-form';
import FAQsForm from '@/components/admin/faqs-form';
import OffersForm from '@/components/admin/offers-form';
import ReviewsApprovalForm from '@/components/admin/reviews-approval-form';
import SeedControl from '@/components/admin/SeedControl';

export default async function AdminDashboard() {
  // --- 1. SERVER-SIDE AUTHENTICATION AND AUTHORIZATION ---
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value || null;

  if (!sessionCookie) {
    // Not authenticated — redirect to login with callback
    redirect('/login?callbackUrl=/admin');
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    // Log decoded UID for debugging purposes
    console.log('Decoded admin UID:', decoded?.uid);

    if (!decoded || decoded.uid !== ADMIN_UID) {
      console.warn('Admin UID check failed', { decodedUid: decoded?.uid, expected: ADMIN_UID });
      // If debug mode is enabled, render debug info instead of redirecting
      if (process.env.NEXT_PUBLIC_ADMIN_DEBUG === 'true') {
        const serverUid = decoded?.uid ?? 'none';
        const expected = ADMIN_UID ?? process.env.NEXT_PUBLIC_ADMIN_UID ?? 'not set';
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-xl p-6 bg-background border rounded">
              <h2 className="text-xl font-bold mb-2">Admin Debug Info</h2>
              <p className="mb-2">Server decoded UID: <code>{serverUid}</code></p>
              <p className="mb-2">Expected ADMIN_UID: <code>{expected}</code></p>
              <p className="text-sm text-muted-foreground">Copy the Server decoded UID into your .env.local as NEXT_PUBLIC_ADMIN_UID, then restart the dev server.</p>
            </div>
          </div>
        );
      }
      
      // Not an admin — redirect to homepage
      redirect('/');
    }

  } catch (err) {
    // Verification failed — redirect to login
    console.warn('Session verification failed:', err);
    redirect('/login?callbackUrl=/admin');
  }


  // --- 2. SERVER-SIDE DATA FETCHING ---
  const [customersResult, bookingsResult, reviewsResult] = await Promise.all([
    getTotalCustomers(),
    getTotalBookings(),
    getPendingReviews(),
  ]);

  const stats = {
    totalCustomers: customersResult?.count ?? 0,
    totalBookings: bookingsResult?.count ?? 0,
    pendingReviews: reviewsResult?.data?.length ?? 0,
  };

  // --- 3. RENDERING ---
  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage services, offers, and review customer feedback</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">Total services booked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Services</CardTitle>
                <CardDescription>Add, edit, or delete services from your platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ServicesForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faqs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage FAQs</CardTitle>
                <CardDescription>Create, edit, or delete frequently asked questions</CardDescription>
              </CardHeader>
              <CardContent>
                <FAQsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Offers</CardTitle>
                <CardDescription>Create and manage promotional offers for your services</CardDescription>
              </CardHeader>
              <CardContent>
                <OffersForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Approvals</CardTitle>
                <CardDescription>Approve or reject customer reviews before publishing</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewsApprovalForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Seeder control for admins */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>One-time Seeder</CardTitle>
              <CardDescription>Run the default data seeder for services and FAQs</CardDescription>
            </CardHeader>
            <CardContent>
              <SeedControl />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

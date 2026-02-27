"use client";

import { useEffect, useState } from "react";
import { Users, Truck, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ServicesForm from "@/components/admin/services-form";
import FAQsForm from "@/components/admin/faqs-form";
import OffersForm from "@/components/admin/offers-form";
import ReviewsApprovalForm from "@/components/admin/reviews-approval-form";
import SeedControl from "@/components/admin/SeedControl";
import { requestApiWithAuth } from "@/lib/client/auth-api";

type Stats = {
  totalCustomers: number;
  totalBookings: number;
  pendingReviews: number;
};

const initialStats: Stats = {
  totalCustomers: 0,
  totalBookings: 0,
  pendingReviews: 0,
};

export default function AdminDashboardContent() {
  const [stats, setStats] = useState<Stats>(initialStats);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      const result = await requestApiWithAuth<{
        totalCustomers?: number;
        totalBookings?: number;
        pendingReviews?: unknown[];
      }>("/api/admin/stats");

      if (!mounted || !result.success || !result.data) {
        return;
      }

      setStats({
        totalCustomers: result.data.totalCustomers ?? 0,
        totalBookings: result.data.totalBookings ?? 0,
        pendingReviews: Array.isArray(result.data.pendingReviews)
          ? result.data.pendingReviews.length
          : 0,
      });
    };

    void loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage services, offers, and review customer feedback</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Unique emails</p>
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

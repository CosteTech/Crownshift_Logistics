'use client';

import { useState, useEffect } from 'react';
import { getServices } from '@/app/actions';
import { getActiveOffers } from '@/lib/offers';
import PromoBanner from '@/components/PromoBanner';
import { EmptyState } from '@/components/EmptyState';
import { OffersCarousel } from '@/components/offers-carousel';
import { Skeleton } from '@/components/ui/skeleton';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  isFeatured: boolean;
  discountPercentage?: number;
  discountEndsAt?: string;
}

export default function OffersPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const result = await getServices();
        if (result.success) {
          setServices(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const offers = getActiveOffers(services);
  const promos = offers.map((offer) => ({
    serviceName: offer.title,
    discount: offer.discountPercentage,
    validUntil: offer.discountEndsAt ? String(offer.discountEndsAt) : '',
  }));

  if (isLoading) {
    return (
      <section className="py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-20 bg-gray-200 rounded-md mb-6 animate-pulse" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Special Offers</h1>
          <p className="text-lg text-muted-foreground">
            Limited-time discounts on our premium logistics services
          </p>
        </div>

        {promos.length > 0 && <PromoBanner promos={promos} />}

        {offers.length === 0 ? (
          <EmptyState
            title="No active offers"
            description="Check back soon for exclusive deals and promotions on our services."
            action={{
              label: 'View Services',
              href: '/client/services',
            }}
          />
        ) : (
          <OffersCarousel />
        )}
      </div>
    </section>
  );
}

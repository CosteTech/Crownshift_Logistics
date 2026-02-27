'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  getApprovedReviews,
  getPublicActiveOffers,
  getPublicServices,
} from '@/app/actions';
import AdvertBox from '@/components/AdvertBox';
import QuoteGeneratorSection from '@/components/sections/quote-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { CheckCircle2, Quote } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  isFeatured: boolean;
}

interface Offer {
  id: string;
  description?: string;
  discountPercent?: number;
  isActive?: boolean;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const result = await getPublicServices();
        if (result.success) {
          setServices((result.data || []) as Service[]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    const fetchOffers = async () => {
      try {
        const result = await getPublicActiveOffers();
        if (result.success) {
          setOffers((result.data || []) as Offer[]);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setIsLoadingOffers(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const result = await getApprovedReviews();
        if (result.success) {
          setReviews((result.data || []) as Review[]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    void fetchServices();
    void fetchOffers();
    void fetchReviews();
  }, []);

  const handleBookNow = (serviceId: string) => {
    if (!user && !isAuthLoading) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/services/${serviceId}`)}`);
      return;
    }
    alert('Booking feature coming soon!');
  };

  return (
    <main className="py-8 px-4 md:px-6 space-y-16">
      <section>
        <div className="max-w-6xl mx-auto">
          <AdvertBox offers={offers} isLoading={isLoadingOffers} />
        </div>
      </section>

      <section>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Our Services</h1>
            <p className="text-lg text-muted-foreground">
              Choose from our comprehensive range of logistics and shipping solutions.
            </p>
          </div>

          {isLoadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <EmptyState
              title="No services available"
              description="Check back soon for our latest logistics solutions, or contact us for custom shipping needs."
              action={{
                label: 'Contact Us',
                href: '/client/contact',
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`flex flex-col ${service.isFeatured ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  {service.isFeatured && (
                    <div className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
                      Featured Service
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Fast & Reliable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Professional Team</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Transparent Pricing</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">${service.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">Starting price</span>
                      </div>
                      <Button onClick={() => handleBookNow(service.id)} className="w-full" size="lg">
                        Book Service
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Client Home Content</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Your Partner in Global Logistics</h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            Delivering excellence, one shipment at a time. Fast, reliable, and secure solutions for all your logistics needs.
          </p>
        </div>
      </section>

      <QuoteGeneratorSection />

      <section id="about" className="py-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">About</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To simplify global logistics through reliable transport, real-time visibility, and responsive customer support.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be the most trusted logistics partner for businesses and individuals moving goods across cities and borders.
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4">Customer Reviews</h3>
            {isLoadingReviews ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                title="No customer reviews yet"
                description="Your feedback matters. Be the first to share your experience."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.slice(0, 6).map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Quote className="h-4 w-4 text-primary" />
                        {review.userName || 'Customer'}
                      </CardTitle>
                      <CardDescription>Rating: {review.rating}/5</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getActiveOffers, getServices } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Offer {
  id: string;
  serviceId: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  isFeatured: boolean;
}

export function OffersCarousel() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersResult, servicesResult] = await Promise.all([
          getActiveOffers(),
          getServices(),
        ]);

        if (offersResult.success) {
          setOffers(offersResult.data || []);
        }

        if (servicesResult.success) {
          const servicesMap: Record<string, Service> = {};
          servicesResult.data?.forEach((service: Service) => {
            servicesMap[service.id] = service;
          });
          setServices(servicesMap);
        }
      } catch (error) {
        console.error('Error fetching carousel data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % offers.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? offers.length - 1 : prevIndex - 1
    );
  };

  const handleBookNow = (offerId: string) => {
    if (!user && !isAuthLoading) {
      // Redirect to login with callback
      router.push(`/login?callbackUrl=${encodeURIComponent('/')}`);
    } else {
      // User is logged in, proceed with booking
      alert('Booking feature coming soon!');
    }
  };

  if (isLoadingData || offers.length === 0) {
    return null;
  }

  const currentOffer = offers[currentIndex];
  const currentService = services[currentOffer.serviceId];

  if (!currentService) {
    return null;
  }

  const discountedPrice = currentService.price * (1 - currentOffer.discountPercent / 100);

  return (
    <section className="w-full py-12 px-4 md:px-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Special Offers</h2>
          <p className="text-muted-foreground">
            Limited time deals on our premium services
          </p>
        </div>

        <div className="relative">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Image/Visual */}
                <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg h-64 md:h-full">
                  <div className="text-white text-center">
                    <div className="text-5xl font-bold mb-2">
                      {currentOffer.discountPercent}%
                    </div>
                    <div className="text-lg">OFF</div>
                  </div>
                </div>

                {/* Offer Details */}
                <div className="flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {currentService.title}
                    </CardTitle>
                    <CardDescription className="text-base mb-4">
                      {currentOffer.description}
                    </CardDescription>
                    <div className="space-y-2 mb-6">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Regular Price: </span>
                        <span className="line-through">
                          ${currentService.price.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-lg font-bold">
                        <span className="text-muted-foreground">Now: </span>
                        <span className="text-green-600">
                          ${discountedPrice.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleBookNow(currentOffer.id)}
                    className="w-full"
                    size="lg"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          {offers.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full border border-input hover:bg-accent transition-colors"
                aria-label="Previous offer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-2">
                {offers.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-primary w-8'
                        : 'bg-muted w-2'
                    }`}
                    aria-label={`Go to offer ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="p-2 rounded-full border border-input hover:bg-accent transition-colors"
                aria-label="Next offer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Slide Counter */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          {currentIndex + 1} of {offers.length}
        </div>
      </div>
    </section>
  );
}

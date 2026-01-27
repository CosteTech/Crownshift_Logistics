'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getServices } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  isFeatured: boolean;
}

export default function ServicesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
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

  const handleBookNow = (serviceId: string) => {
    if (!user && !isAuthLoading) {
      // Redirect to login with callback
      router.push(`/login?callbackUrl=${encodeURIComponent(`/services/${serviceId}`)}`);
    } else {
      // User is logged in, proceed with booking
      alert('Booking feature coming soon!');
    }
  };

  return (
    <section className="py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-lg text-muted-foreground">
            Choose from our comprehensive range of logistics and shipping solutions
          </p>
        </div>

        {/* Services Grid */}
        {isLoading ? (
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">No services available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`flex flex-col ${service.isFeatured ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                {/* Featured Badge */}
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
                  {/* Features */}
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

                  {/* Price and CTA */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        ${service.price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">Starting price</span>
                    </div>
                    <Button
                      onClick={() => handleBookNow(service.id)}
                      className="w-full"
                      size="lg"
                    >
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
  );
}

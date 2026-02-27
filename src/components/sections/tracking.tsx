"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, Truck, PackageCheck, Anchor, Loader2, ServerCrash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

interface TrackingStep {
  status: string;
  icon: React.ElementType;
  date: string | null;
  location: string | null;
  completed: boolean;
}

interface ShipmentData {
    id: string;
    status: string;
    origin: string;
    destination: string;
    estimatedDeliveryDate: string;
    trackingNumber: string;
    history: { status: string; date: string; location: string }[];
}

const getTrackingSteps = (shipment: ShipmentData | null): TrackingStep[] => {
    const baseSteps = [
      { status: 'Order Confirmed', icon: CheckCircle, date: null, location: null, completed: false },
      { status: 'In Transit', icon: Truck, date: null, location: null, completed: false },
      { status: 'Out for Delivery', icon: PackageCheck, date: null, location: null, completed: false },
      { status: 'Delivered', icon: Anchor, date: null, location: null, completed: false },
    ];

    if (!shipment || !shipment.history) return baseSteps;

    let completedFound = false;
    return baseSteps.map(step => {
        const historyEntry = shipment.history.find(h => h.status === step.status);
        if (historyEntry) {
            completedFound = true;
            return {
                ...step,
                date: new Date(historyEntry.date).toLocaleDateString(),
                location: historyEntry.location,
                completed: true,
            };
        }
        return step;
    });
};


export default function TrackingSection() {
  const [trackingId, setTrackingId] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { firestore } = useFirebase();

  const handleTrack = async () => {
    if (!trackingId) return;
    setIsLoading(true);
    setError(null);
    setShipment(null);
    setSearchedId(trackingId);

    try {
      const shipmentsRef = collection(firestore, 'shipments');
      const q = query(shipmentsRef, where('trackingNumber', '==', trackingId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No shipment found with this tracking number.');
        setShipment(null);
      } else {
        const doc = querySnapshot.docs[0];
        // A more robust solution would be to validate this with Zod
        setShipment({ id: doc.id, ...doc.data() } as ShipmentData);
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while tracking the shipment.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const trackingSteps = getTrackingSteps(shipment);

  return (
    <section id="tracking" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Track Your Shipment</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Enter your tracking number to get real-time updates on your shipment.
          </p>
        </div>
        <Card className="mt-12 max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder="Enter Tracking ID (e.g., CS123456789)"
                className="flex-grow text-base"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              />
              <Button onClick={handleTrack} className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
            <div className="flex justify-center mt-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}

        {error && !isLoading && (
            <Card className="mt-8 max-w-4xl mx-auto text-center border-destructive">
                <CardHeader>
                    <CardTitle className="font-headline text-destructive">Tracking Error</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-12">
                    <ServerCrash className="w-16 h-16 text-destructive/50 mb-4" />
                    <p className="text-destructive">{error}</p>
                </CardContent>
            </Card>
        )}

        {shipment && !isLoading && !error && (
          <Card className="mt-8 max-w-4xl mx-auto animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="font-headline">Shipment Status for #{searchedId}</CardTitle>
              <CardDescription>
                Estimated Delivery: {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border -translate-x-1/2" />
                
                <ul className="space-y-8">
                  {trackingSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className={cn(
                          "z-10 flex h-10 w-10 items-center justify-center rounded-full",
                          step.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="ml-6">
                        <h4 className={cn("font-headline font-semibold", step.completed ? 'text-foreground' : 'text-muted-foreground')}>
                          {step.status}
                        </h4>
                        {step.date && <p className="text-sm text-muted-foreground">{step.date}</p>}
                        {step.location && <p className="text-sm text-muted-foreground">{step.location}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

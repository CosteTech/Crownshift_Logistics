
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getQuote, type QuoteFormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Send, CheckCircle, Copy } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirebase } from "@/firebase/provider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const QuoteSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  origin: z.string().min(2, { message: "Origin must be at least 2 characters." }),
  destination: z.string().min(2, { message: "Destination must be at least 2 characters." }),
  length: z.coerce.number().positive({ message: "Must be a positive number." }),
  width: z.coerce.number().positive({ message: "Must be a positive number." }),
  height: z.coerce.number().positive({ message: "Must be a positive number." }),
  weight: z.coerce.number().positive({ message: "Must be a positive number." }),
});

type QuoteFormData = z.infer<typeof QuoteSchema>;

function QuoteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Quote...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4" />
          Get AI-Powered Quote
        </>
      )}
    </Button>
  );
}

function generateTrackingNumber(): string {
  const prefix = 'CS';
  const length = 10;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default function QuoteGeneratorSection() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const initialState: QuoteFormState = { message: "", errors: {} };
  const [state, formAction] = useActionState(getQuote, initialState);

  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string; trackingNumber?: string} | null>(null);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(QuoteSchema),
    defaultValues: {
      name: "",
      email: "",
      origin: "",
      destination: "",
      length: undefined,
      width: undefined,
      height: undefined,
      weight: undefined,
    },
  });
  
  useEffect(() => {
    if (state.message && state.message !== 'Quote generated successfully.' && !state.errors) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleBookShipment = async () => {
    if (!state.quoteDetails || !state.quoteUSD || !state.breakdown || !firestore) return;

    setIsBooking(true);
    
    const { name, email, origin, destination, length, width, height, weight } = state.quoteDetails;
    const trackingNumber = generateTrackingNumber();

    const shipmentData = {
      clientId: `anon_${Date.now()}`,
      origin: origin,
      destination: destination,
      dimensions: `${length}x${width}x${height} cm`,
      weight: `${weight} kg`,
      status: 'Order Confirmed',
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      trackingNumber: trackingNumber,
      creationDate: serverTimestamp(),
      quote: state.quoteUSD, // Storing USD quote
      quoteBreakdown: state.breakdown,
      clientDetails: {
        name: name,
        email: email,
      },
    };

    try {
      await addDoc(collection(firestore, 'shipments'), shipmentData);
      setBookingResult({
        success: true,
        message: 'Shipment booked successfully!',
        trackingNumber: trackingNumber,
      });
    } catch (error) {
      console.error("Error booking shipment:", error);
      setBookingResult({
        success: false,
        message: "Failed to book shipment. Please try again.",
      });
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "Could not save shipment details. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (bookingResult?.trackingNumber) {
      navigator.clipboard.writeText(bookingResult.trackingNumber);
      toast({
        title: "Copied to Clipboard",
        description: "Your tracking number has been copied.",
      });
    }
  };

  return (
    <>
    <section id="quote" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Instant Shipping Quote</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Enter your details and package information to get a real-time, AI-generated shipping estimate.
              It&apos;s fast, easy, and transparent.
            </p>
             <Card className="mt-8">
              <CardContent className="p-6">
                <form action={formAction} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" {...form.register("name")} />
                      {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" {...form.register("email")} />
                      {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin</Label>
                      <Input id="origin" placeholder="e.g., New York, NY" {...form.register("origin")} />
                      {form.formState.errors.origin && <p className="text-sm text-destructive">{form.formState.errors.origin.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination</Label>
                      <Input id="destination" placeholder="e.g., Los Angeles, CA" {...form.register("destination")} />
                      {form.formState.errors.destination && <p className="text-sm text-destructive">{form.formState.errors.destination.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label>Package Dimensions (cm)</Label>
                      <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Input id="length" type="number" placeholder="Length" {...form.register("length")} />
                            {form.formState.errors.length && <p className="text-sm text-destructive">{form.formState.errors.length.message}</p>}
                          </div>
                          <div>
                            <Input id="width" type="number" placeholder="Width" {...form.register("width")} />
                            {form.formState.errors.width && <p className="text-sm text-destructive">{form.formState.errors.width.message}</p>}
                          </div>
                          <div>
                            <Input id="height" type="number" placeholder="Height" {...form.register("height")} />
                            {form.formState.errors.height && <p className="text-sm text-destructive">{form.formState.errors.height.message}</p>}
                          </div>
                      </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" placeholder="e.g., 5" {...form.register("weight")} />
                    {form.formState.errors.weight && <p className="text-sm text-destructive">{form.formState.errors.weight.message}</p>}
                  </div>
                  <QuoteSubmitButton />
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center justify-center">
            {state?.quoteUSD && state.quoteKES ? (
               <Card className="w-full max-w-md shadow-2xl animate-in fade-in-50 zoom-in-95">
                <CardHeader className="text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
                  <CardTitle className="text-2xl font-headline">Your Instant Quote</CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                    <div className="space-y-4">
                        <div>
                            <p className="text-5xl font-bold font-headline text-primary">KSH {state.quoteKES.toFixed(2)}</p>
                            <p className="text-muted-foreground mt-1">Estimated Cost (KES)</p>
                        </div>
                        <div>
                             <p className="text-3xl font-bold font-headline text-muted-foreground">${state.quoteUSD.toFixed(2)}</p>
                             <p className="text-sm text-muted-foreground">Estimated Cost (USD)</p>
                        </div>
                    </div>
                     <Button onClick={handleBookShipment} size="lg" className="mt-6" disabled={isBooking}>
                        {isBooking ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                           <Send className="mr-2 h-4 w-4" />
                        )}
                        Book Shipment
                    </Button>
                </CardContent>
                <CardFooter className="bg-secondary p-6 rounded-b-lg">
                  <div>
                    <h4 className="font-semibold font-headline">Quote Breakdown:</h4>
                    <CardDescription className="mt-2 text-sm">{state.breakdown}</CardDescription>
                  </div>
                </CardFooter>
              </Card>
            ) : (
                <Card className="w-full max-w-md text-center border-dashed">
                    <CardHeader>
                        <CardTitle className="font-headline">Awaiting Your Details</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                        <Zap className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Your AI-generated quote will appear here.</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
      </div>
    </section>
    <AlertDialog open={!!bookingResult?.success}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <AlertDialogTitle className="text-center">Shipment Booked Successfully!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your tracking number is: <br />
              <strong className="text-lg text-primary">{bookingResult?.trackingNumber}</strong>
              <br />
              You can use this to track your shipment on our website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCopyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <AlertDialogAction onClick={() => setBookingResult(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

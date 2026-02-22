"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, WithId } from '@/firebase/firestore/use-doc';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Trash, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const historyItemSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  location: z.string().min(1, 'Location is required'),
  date: z.coerce.date(),
});

const shipmentSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  clientDetails: z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Invalid email address'),
  }),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  status: z.string().min(1, 'Status is required'),
  estimatedDeliveryDate: z.coerce.date(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  history: z.array(historyItemSchema).optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

interface ShipmentDoc {
  id: string;
  trackingNumber: string;
  clientDetails: { name: string; email: string };
  origin: string;
  destination: string;
  status: string;
  estimatedDeliveryDate: string;
  dimensions?: string;
  weight?: string;
  history?: { status: string; location: string; date: { toDate: () => Date } }[];
  creationDate?: { toDate: () => Date };
}

export default function ShipmentEditPage() {
  const params = useParams();
  // Normalize id: handle undefined or array cases
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = id === 'new';
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!id) {
    return <div className="text-center text-destructive">Invalid shipment ID</div>;
  }

  const shouldFetch = !!firestore && !isNew && !!id;
  const shipmentRef = useMemoFirebase(() => {
    return shouldFetch ? doc(firestore!, 'shipments', id) : null;
  }, [firestore, id, shouldFetch]);

  const { data: shipment, isLoading, error } = useDoc<ShipmentDoc>(
    shouldFetch ? shipmentRef : undefined
  );

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      trackingNumber: `CS${Date.now()}`,
      status: 'Order Confirmed',
      estimatedDeliveryDate: new Date(),
      history: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'history',
  });

  useEffect(() => {
    if (shipment && !isNew) {
      const estimatedDelivery = shipment.estimatedDeliveryDate
        ? new Date(shipment.estimatedDeliveryDate)
        : new Date();
      reset({
        ...shipment,
        estimatedDeliveryDate: estimatedDelivery,
        history: shipment.history?.map((h: any) => ({ ...h, date: h.date.toDate() })) || [],
      });
    }
  }, [shipment, reset, isNew]);

  const onSubmit = async (data: ShipmentFormData) => {
    if (!firestore) return;
    setIsSubmitting(true);
    
    const dataToSave = {
      ...data,
      estimatedDeliveryDate: data.estimatedDeliveryDate instanceof Date
        ? data.estimatedDeliveryDate.toISOString()
        : new Date(data.estimatedDeliveryDate).toISOString(),
      history: data.history?.map(h => ({...h, date: h.date})),
    };

    if (isNew) {
      try {
        const resp = await fetch('/api/shipments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...dataToSave }) });
        const json = await resp.json();
        if (resp.ok) {
          toast({ title: 'Success', description: 'Shipment created successfully.' });
          router.push('/admin');
        } else {
          throw new Error(json?.error || 'create failed');
        }
      } catch (e) {
        console.error('Create shipment failed', e);
        setIsSubmitting(false);
      }
    } else {
      try {
        const resp = await fetch('/api/shipments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, updates: dataToSave }) });
        const json = await resp.json();
        if (resp.ok) {
          toast({ title: 'Success', description: 'Shipment updated successfully.' });
          router.push('/admin');
        } else {
          throw new Error(json?.error || 'update failed');
        }
      } catch (e) {
        console.error('Update shipment failed', e);
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="text-center text-destructive">Error: {error.message}</div>;
  }
  if (!isNew && !shipment && !isLoading) {
    return <div className="text-center">Shipment not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{isNew ? 'Create New Shipment' : 'Edit Shipment'}</CardTitle>
          <CardDescription>
            {isNew ? 'Fill in the details to create a new shipment.' : `Editing shipment #${shipment?.trackingNumber}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input id="trackingNumber" {...register('trackingNumber')} />
                {errors.trackingNumber && <p className="text-sm text-destructive">{errors.trackingNumber.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Order Confirmed">Order Confirmed</SelectItem>
                        <SelectItem value="In Transit">In Transit</SelectItem>
                        <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Delayed">Delayed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" {...register('clientDetails.name')} />
                {errors.clientDetails?.name && <p className="text-sm text-destructive">{errors.clientDetails.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input id="clientEmail" type="email" {...register('clientDetails.email')} />
                {errors.clientDetails?.email && <p className="text-sm text-destructive">{errors.clientDetails.email.message}</p>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input id="origin" {...register('origin')} />
                {errors.origin && <p className="text-sm text-destructive">{errors.origin.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input id="destination" {...register('destination')} />
                {errors.destination && <p className="text-sm text-destructive">{errors.destination.message}</p>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
                <Input id="estimatedDeliveryDate" type="date" {...register('estimatedDeliveryDate')} />
                {errors.estimatedDeliveryDate && <p className="text-sm text-destructive">{errors.estimatedDeliveryDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions (cm)</Label>
                <Input id="dimensions" {...register('dimensions')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" {...register('weight')} />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Shipment History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Controller
                        name={`history.${index}.status`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Order Confirmed">Order Confirmed</SelectItem>
                              <SelectItem value="In Transit">In Transit</SelectItem>
                              <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                              <SelectItem value="Delivered">Delivered</SelectItem>
                              <SelectItem value="Delayed">Delayed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input {...register(`history.${index}.location`)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Controller
                        name={`history.${index}.date`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="datetime-local"
                            value={field.value ? new Date(field.value.getTime() - (field.value.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(new Date(e.target.value))}
                          />
                        )}
                      />
                    </div>
                    <Button type="button" variant="destructive" onClick={() => remove(index)}><Trash className="mr-2 h-4 w-4"/> Remove</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ status: '', location: '', date: new Date() })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add History Entry
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isNew ? 'Create Shipment' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

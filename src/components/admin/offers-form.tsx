'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getOffers, getServices, addOffer, updateOffer, deleteOffer } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Edit2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const offerSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  discountPercent: z.coerce.number().min(1).max(100, 'Discount must be between 1-100%'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  isActive: z.boolean().default(true),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface Offer extends OfferFormData {
  id: string;
}

interface Service {
  id: string;
  title: string;
  price: number;
}

interface OffersFormProps {
  onSuccess?: () => void;
}

export default function OffersForm({ onSuccess }: OffersFormProps) {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      serviceId: '',
      discountPercent: 10,
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersResult, servicesResult] = await Promise.all([getOffers(), getServices()]);

      if (offersResult.success) {
        setOffers(offersResult.data || []);
      }

      if (servicesResult.success) {
        setServices(servicesResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: OfferFormData) => {
    try {
      if (editingId) {
        const result = await updateOffer(editingId, data);
        if (result.success) {
          toast({ title: 'Success', description: 'Offer updated successfully' });
          setEditingId(null);
          form.reset();
          fetchData();
          onSuccess?.();
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      } else {
        const result = await addOffer(data);
        if (result.success) {
          toast({ title: 'Success', description: 'Offer created successfully' });
          form.reset();
          fetchData();
          onSuccess?.();
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' });
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingId(offer.id);
    form.reset(offer);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const result = await deleteOffer(id);
      if (result.success) {
        toast({ title: 'Success', description: 'Offer deleted successfully' });
        fetchData();
        onSuccess?.();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Offer' : 'Create New Offer'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title} (${service.price.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="100" placeholder="10" {...field} />
                    </FormControl>
                    <FormDescription>Discount between 1-100%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Limited time offer for new customers"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Active (visible to customers)</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update Offer' : 'Create Offer'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Offers List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Offers</CardTitle>
          <CardDescription>Manage your promotional offers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No offers yet</p>
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => {
                const service = services.find((s) => s.id === offer.serviceId);
                const discountedPrice = service
                  ? service.price * (1 - offer.discountPercent / 100)
                  : 0;

                return (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        {service?.title}
                        {offer.isActive ? (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {offer.discountPercent}% off • Was ${service?.price.toFixed(2)}, Now $
                        {discountedPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-foreground mt-1">{offer.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(offer)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(offer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

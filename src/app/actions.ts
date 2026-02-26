'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateInstantQuote } from '@/ai/flows/instant-quote-generation';
import { logger } from '@/lib/logger';
import { apiFetchJson } from '@/lib/server/internal-api';

type ApiResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  id?: string;
  count?: number;
};

function parseApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

async function requestApi<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const result = await apiFetchJson<Record<string, unknown>>(path, init);
  if (!result.ok) {
    return {
      success: false,
      error: parseApiError(result.data, `Request failed (${result.status})`),
    };
  }

  const payload = result.data as Record<string, unknown> | null;
  if (!payload || payload.success === false) {
    return {
      success: false,
      error: parseApiError(payload, 'Request failed'),
    };
  }

  return {
    success: true,
    data: (payload.data as T) ?? (payload as unknown as T),
    id: typeof payload.id === 'string' ? payload.id : undefined,
    count: typeof payload.count === 'number' ? payload.count : undefined,
  };
}

// ==================== AUTH ====================
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('__session');
  redirect('/');
}

// ==================== QUOTE ====================
const QuoteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  origin: z.string().min(2, 'Origin must be at least 2 characters.'),
  destination: z.string().min(2, 'Destination must be at least 2 characters.'),
  length: z.coerce.number().positive('Length must be a positive number.'),
  width: z.coerce.number().positive('Width must be a positive number.'),
  height: z.coerce.number().positive('Height must be a positive number.'),
  weight: z.coerce.number().positive('Weight must be a positive number.'),
});

export type QuoteFormState = {
  message: string;
  quoteKES?: number;
  quoteUSD?: number;
  breakdown?: string;
  quoteDetails?: z.infer<typeof QuoteSchema>;
  errors?: {
    name?: string[];
    email?: string[];
    origin?: string[];
    destination?: string[];
    length?: string[];
    width?: string[];
    height?: string[];
    weight?: string[];
    _form?: string[];
  };
};

export async function getQuote(
  prevState: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const validatedFields = QuoteSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generateInstantQuote(validatedFields.data);
    if (result.quoteUSD && result.quoteKES) {
      return {
        message: 'Quote generated successfully.',
        quoteUSD: result.quoteUSD,
        quoteKES: result.quoteKES,
        breakdown: result.breakdown,
        quoteDetails: validatedFields.data,
      };
    }

    return {
      message:
        'Failed to generate quote. The AI model could not determine a price. Please try again with different values.',
    };
  } catch (error) {
    logger.error('Quote generation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { message: 'An unexpected error occurred on the server. Please try again later.' };
  }
}

// ==================== SERVICES ====================
export async function getServices() {
  return requestApi<any[]>('/api/services');
}

export async function getPublicServices() {
  return requestApi<any[]>('/api/services/public');
}

export async function addService(data: {
  title: string;
  description: string;
  price: number;
  isFeatured: boolean;
}) {
  const result = await requestApi<unknown>('/api/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.success ? { success: true, id: result.id } : result;
}

export async function updateService(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    price: number;
    isFeatured: boolean;
  }>
) {
  return requestApi(`/api/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: string) {
  return requestApi(`/api/services/${id}`, { method: 'DELETE' });
}

// ==================== OFFERS ====================
export async function getOffers() {
  return requestApi<any[]>('/api/offers');
}

export async function getPublicActiveOffers() {
  return requestApi<any[]>('/api/offers/public');
}

export async function addOffer(data: {
  serviceId: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}) {
  const result = await requestApi<unknown>('/api/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.success ? { success: true, id: result.id } : result;
}

export async function updateOffer(
  id: string,
  data: Partial<{
    serviceId: string;
    discountPercent: number;
    description: string;
    isActive: boolean;
  }>
) {
  return requestApi(`/api/offers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteOffer(id: string) {
  return requestApi(`/api/offers/${id}`, { method: 'DELETE' });
}

// ==================== REVIEWS ====================
export async function getApprovedReviews() {
  return requestApi<any[]>('/api/reviews');
}

export async function getPendingReviews() {
  return requestApi<any[]>('/api/admin/reviews/pending');
}

// ==================== FAQS ====================
export async function getFAQs() {
  return requestApi<any[]>('/api/faqs');
}

export async function addFAQ(data: { question: string; answer: string }) {
  const result = await requestApi<unknown>('/api/faqs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.success ? { success: true, id: result.id } : result;
}

export async function updateFAQ(
  id: string,
  data: {
    question?: string;
    answer?: string;
    isVisible?: boolean;
    order?: number;
  }
) {
  return requestApi(`/api/faqs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteFAQ(id: string) {
  return requestApi(`/api/faqs/${id}`, { method: 'DELETE' });
}

// ==================== ANALYTICS ====================
export async function getTotalCustomers() {
  const result = await requestApi<{ totalCustomers?: number }>('/api/admin/stats');
  if (!result.success) return result;
  return {
    success: true,
    count: (result.data as { totalCustomers?: number } | undefined)?.totalCustomers ?? 0,
  };
}

export async function getTotalBookings() {
  const result = await requestApi<{ totalBookings?: number }>('/api/admin/stats');
  if (!result.success) return result;
  return {
    success: true,
    count: (result.data as { totalBookings?: number } | undefined)?.totalBookings ?? 0,
  };
}

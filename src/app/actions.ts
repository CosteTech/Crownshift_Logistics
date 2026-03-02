'use server';

import { z } from 'zod';
import { generateInstantQuote } from '@/ai/flows/instant-quote-generation';
import { logger } from '@/lib/logger';
import { apiFetchJson } from '@/lib/server/internal-api';

type ApiResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
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
  };
}

const QuoteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
<<<<<<< HEAD
  phone: z.string().optional(),
=======
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
  origin: z.string().min(2, 'Origin must be at least 2 characters.'),
  destination: z.string().min(2, 'Destination must be at least 2 characters.'),
  length: z.coerce.number().positive('Length must be a positive number.'),
  width: z.coerce.number().positive('Width must be a positive number.'),
  height: z.coerce.number().positive('Height must be a positive number.'),
  weight: z.coerce.number().positive('Weight must be a positive number.'),
<<<<<<< HEAD
  packageType: z.enum(['standard', 'fragile', 'perishable', 'oversized', 'document']).optional(),
  urgency: z.enum(['standard', 'express', 'same-day']).optional(),
});

// Type for the breakdown object from AI
type QuoteBreakdown = {
  baseRate: number;
  distanceCharge: number;
  volumetricSurcharge: number;
  weightSurcharge: number;
  handlingFee: number;
  urgencySurcharge: number;
  insuranceFee: number;
};

=======
});

>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
export type QuoteFormState = {
  message: string;
  quoteKES?: number;
  quoteUSD?: number;
<<<<<<< HEAD
  breakdown?: QuoteBreakdown;
  estimatedDeliveryDays?: number;
  summary?: string;
  recommendations?: string;
=======
  breakdown?: string;
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
  quoteDetails?: z.infer<typeof QuoteSchema>;
  errors?: {
    name?: string[];
    email?: string[];
<<<<<<< HEAD
    phone?: string[];
=======
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
    origin?: string[];
    destination?: string[];
    length?: string[];
    width?: string[];
    height?: string[];
    weight?: string[];
<<<<<<< HEAD
    packageType?: string[];
    urgency?: string[];
=======
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
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
<<<<<<< HEAD
        estimatedDeliveryDays: result.estimatedDeliveryDays,
        summary: result.summary,
        recommendations: result.recommendations,
=======
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
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

export async function getPublicServices() {
  return requestApi<any[]>('/api/services/public');
}

export async function getPublicActiveOffers() {
  return requestApi<any[]>('/api/offers/public');
}

export async function getApprovedReviews() {
  return requestApi<any[]>('/api/reviews');
}

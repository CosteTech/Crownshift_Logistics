
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { generateInstantQuote } from '@/ai/flows/instant-quote-generation';
import { z } from 'zod';
import { getFirestoreAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import { isServiceDeletable, isFAQDeletable, isDefaultService, isDefaultFAQ } from '@/lib/data-models';

// ==================== AUTH ====================
export async function logoutAction() {
  const cookieStore = await cookies();
  
  // Clear the session cookie
  cookieStore.delete('__session');
  
  // Redirect to home page
  redirect('/');
}

// Create or update user profile after authentication
export async function createUserProfile(userId: string, data: {
  email: string;
  fullName?: string;
  role?: 'admin' | 'client';
  company?: string;
}) {
  try {
    const db = await getFirestoreAdmin();
    const userRef = db.collection('users').doc(userId);
    
    await userRef.set(
      {
        email: data.email,
        fullName: data.fullName || '',
        role: data.role || 'client',
        company: data.company || '',
        updatedAt: new Date(),
        createdAt: (await userRef.get()).exists ? undefined : new Date(),
      },
      { merge: true }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: 'Failed to create user profile' };
  }
}

// Get user profile (with role information)
export async function getUserProfile(userId: string) {
  try {
    const db = await getFirestoreAdmin();
    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      return { success: false, error: 'User profile not found' };
    }
    
    return { success: true, data: doc.data() };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: 'Failed to fetch user profile' };
  }
}

const QuoteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  origin: z.string().min(2, "Origin must be at least 2 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters."),
  length: z.coerce.number().positive("Length must be a positive number."),
  width: z.coerce.number().positive("Width must be a positive number."),
  height: z.coerce.number().positive("Height must be a positive number."),
  weight: z.coerce.number().positive("Weight must be a positive number."),
});

// Define state for the form
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

export async function getQuote(prevState: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
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
    } else {
       return { message: 'Failed to generate quote. The AI model could not determine a price. Please try again with different values.' };
    }
  } catch (e) {
    console.error('Error details:', e instanceof Error ? e.message : e);
    return { message: 'An unexpected error occurred on the server. Please try again later.' };
  }
}
// ==================== SERVICES ====================
export async function getServices() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db.collection('services').get();
    const services: any[] = [];
    snapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: services };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch services' };
  }
}

export async function addService(data: {
  title: string;
  description: string;
  price: number;
  isFeatured: boolean;
}) {
  try {
    const db = await getFirestoreAdmin();
    const docRef = await db.collection('services').add({
      ...data,
      createdAt: new Date(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to add service' };
  }
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
  try {
    const db = await getFirestoreAdmin();
    await db.collection('services').doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to update service' };
  }
}

export async function deleteService(id: string) {
  try {
    // Prevent deletion of default services
    if (!isServiceDeletable(id)) {
      return { 
        success: false, 
        error: 'Default services cannot be deleted. You can hide them or edit their details.' 
      };
    }

    const db = await getFirestoreAdmin();
    await db.collection('services').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to delete service' };
  }
}

// ==================== OFFERS ====================
export async function getOffers() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db.collection('offers').get();
    const offers: any[] = [];
    snapshot.forEach((doc) => {
      offers.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: offers };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch offers' };
  }
}

export async function getActiveOffers() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db
      .collection('offers')
      .where('isActive', '==', true)
      .get();
    const offers: any[] = [];
    snapshot.forEach((doc) => {
      offers.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: offers };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch active offers' };
  }
}

export async function addOffer(data: {
  serviceId: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}) {
  try {
    const db = await getFirestoreAdmin();
    const docRef = await db.collection('offers').add({
      ...data,
      createdAt: new Date(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to add offer' };
  }
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
  try {
    const db = await getFirestoreAdmin();
    await db.collection('offers').doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to update offer' };
  }
}

export async function deleteOffer(id: string) {
  try {
    const db = await getFirestoreAdmin();
    await db.collection('offers').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to delete offer' };
  }
}

// ==================== REVIEWS ====================
export async function getApprovedReviews() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db
      .collection('reviews')
      .where('status', '==', 'approved')
      .get();
    const reviews: any[] = [];
    snapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: reviews };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch reviews' };
  }
}

export async function submitReview(data: {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  serviceId: string;
}) {
  try {
    const db = await getFirestoreAdmin();

    // Check if user has completed a service
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('userId', '==', data.userId)
      .where('serviceId', '==', data.serviceId)
      .where('status', '==', 'completed')
      .get();

    if (bookingsSnapshot.empty) {
      return {
        success: false,
        error: 'You must have completed this service to leave a review',
      };
    }

    // Add review with pending status
    const docRef = await db.collection('reviews').add({
      ...data,
      status: 'pending',
      createdAt: new Date(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to submit review' };
  }
}

export async function getPendingReviews() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db
      .collection('reviews')
      .where('status', '==', 'pending')
      .get();
    const reviews: any[] = [];
    snapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: reviews };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch pending reviews' };
  }
}

export async function approveReview(id: string) {
  try {
    const db = await getFirestoreAdmin();
    await db.collection('reviews').doc(id).update({
      status: 'approved',
      approvedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to approve review' };
  }
}

export async function rejectReview(id: string) {
  try {
    const db = await getFirestoreAdmin();
    await db.collection('reviews').doc(id).update({
      status: 'rejected',
      rejectedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to reject review' };
  }
}

// ==================== FAQs ====================
export async function getFAQs() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db.collection('faqs').orderBy('order').get();
    const faqs: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      faqs.push({ 
        id: doc.id,
        ...data,
        isDefault: data.isDefault || false,
        isVisible: data.isVisible !== false,
      });
    });
    return { success: true, data: faqs };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch FAQs' };
  }
}

export async function addFAQ(data: {
  question: string;
  answer: string;
}) {
  try {
    const db = await getFirestoreAdmin();
    
    // Generate slug from question
    const slug = data.question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Get the highest order number
    const snapshot = await db.collection('faqs').orderBy('order', 'desc').limit(1).get();
    const maxOrder = snapshot.empty ? 0 : (snapshot.docs[0].data().order || 0);

    const newDocRef = await db.collection('faqs').add({
      question: data.question,
      answer: data.answer,
      slug: slug,
      isDefault: false,
      isVisible: true,
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, id: newDocRef.id };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to create FAQ' };
  }
}

export async function updateFAQ(id: string, data: {
  question?: string;
  answer?: string;
  isVisible?: boolean;
  order?: number;
}) {
  try {
    const db = await getFirestoreAdmin();
    
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // If question changes, update slug
    if (data.question) {
      updateData.slug = data.question
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    }

    await db.collection('faqs').doc(id).update(updateData);
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to update FAQ' };
  }
}

export async function deleteFAQ(id: string) {
  try {
    // Prevent deletion of default FAQs
    if (!isFAQDeletable(id)) {
      return { 
        success: false, 
        error: 'Default FAQs cannot be deleted. You can hide them or edit their content.' 
      };
    }

    const db = await getFirestoreAdmin();
    await db.collection('faqs').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to delete FAQ' };
  }
}

// ==================== ANALYTICS ====================
export async function getTotalCustomers() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db.collection('users').get();
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch customer count' };
  }
}

export async function getTotalBookings() {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db.collection('bookings').get();
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : error);
    return { success: false, error: 'Failed to fetch booking count' };
  }
}
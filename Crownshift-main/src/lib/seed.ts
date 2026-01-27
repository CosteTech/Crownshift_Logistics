/**
 * Seed logic for default services and FAQs
 * Automatically initializes the database with defaults
 */

import { getFirestoreAdmin } from '@/firebase/server-init';
import { DEFAULT_SERVICES, DEFAULT_FAQS, Service, FAQ } from '@/lib/data-models';

/**
 * Seed default services if they don't exist
 * Should be called once on first deployment or manually
 */
export async function seedDefaultServices() {
  try {
    const db = await getFirestoreAdmin();

    for (const service of DEFAULT_SERVICES) {
      const docRef = db.collection('services').doc(service.id);
      const docSnap = await docRef.get();

      // Only create if doesn't exist
      if (!docSnap.exists) {
        await docRef.set({
          ...service,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[SEED] Created default service: ${service.title}`);
      }
    }

    return { success: true, message: 'Default services seeded successfully' };
  } catch (error) {
    console.error('[SEED] Error seeding services:', error);
    return { success: false, error: 'Failed to seed services' };
  }
}

/**
 * Seed default FAQs if they don't exist
 * Should be called once on first deployment or manually
 */
export async function seedDefaultFAQs() {
  try {
    const db = await getFirestoreAdmin();

    for (const faq of DEFAULT_FAQS) {
      const docRef = db.collection('faqs').doc(faq.id);
      const docSnap = await docRef.get();

      // Only create if doesn't exist
      if (!docSnap.exists) {
        await docRef.set({
          ...faq,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[SEED] Created default FAQ: ${faq.question}`);
      }
    }

    return { success: true, message: 'Default FAQs seeded successfully' };
  } catch (error) {
    console.error('[SEED] Error seeding FAQs:', error);
    return { success: false, error: 'Failed to seed FAQs' };
  }
}

/**
 * Seed both services and FAQs
 */
export async function seedDefaults() {
  console.log('[SEED] Starting database seed...');

  const servicesResult = await seedDefaultServices();
  const faqsResult = await seedDefaultFAQs();

  console.log('[SEED] Seeding complete:', {
    services: servicesResult,
    faqs: faqsResult,
  });

  return {
    success: servicesResult.success && faqsResult.success,
    services: servicesResult,
    faqs: faqsResult,
  };
}

/**
 * Check if defaults are initialized
 */
export async function areDefaultsInitialized(): Promise<boolean> {
  try {
    const db = await getFirestoreAdmin();

    // Check if any default service exists
    const servicesSnap = await db.collection('services').doc(DEFAULT_SERVICES[0].id).get();
    const facsSnap = await db.collection('faqs').doc(DEFAULT_FAQS[0].id).get();

    return servicesSnap.exists && facsSnap.exists;
  } catch (error) {
    console.error('Error checking defaults:', error);
    return false;
  }
}

/**
 * Get all services including defaults (for client pages)
 */
export async function getAllServices(): Promise<Service[]> {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db.collection('services').orderBy('order').get();

    const services: Service[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        slug: data.slug || '',
        title: data.title || '',
        description: data.description || '',
        price: data.price,
        icon: data.icon,
        isDefault: data.isDefault || false,
        isVisible: data.isVisible !== false, // Default to true
        order: data.order || 999,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    return services.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

/**
 * Get visible services only (for client pages)
 */
export async function getVisibleServices(): Promise<Service[]> {
  const services = await getAllServices();
  return services.filter(s => s.isVisible);
}

/**
 * Get all FAQs including defaults
 */
export async function getAllFAQs(): Promise<FAQ[]> {
  try {
    const db = await getFirestoreAdmin();
    const snapshot = await db.collection('faqs').orderBy('order').get();

    const faqs: FAQ[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      faqs.push({
        id: doc.id,
        slug: data.slug || '',
        question: data.question || '',
        answer: data.answer || '',
        isDefault: data.isDefault || false,
        isVisible: data.isVisible !== false,
        order: data.order || 999,
        lastUpdatedBy: data.lastUpdatedBy,
        lastUpdatedAt: data.lastUpdatedAt?.toDate?.(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    return faqs.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

/**
 * Get visible FAQs only
 */
export async function getVisibleFAQs(): Promise<FAQ[]> {
  const faqs = await getAllFAQs();
  return faqs.filter(f => f.isVisible);
}

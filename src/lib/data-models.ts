/**
 * Data models for Services and FAQs
 * These define the structure of our data
 */

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  price?: number;
  icon?: string; // icon name or URL
  isDefault: boolean; // Mark default services
  isVisible: boolean; // Can be hidden by admin
  order: number; // For ordering
  createdAt: Date;
  updatedAt: Date;
}

export interface FAQ {
  id: string;
  slug: string;
  question: string;
  answer: string;
  isDefault: boolean; // Mark default FAQs
  isVisible: boolean; // Can be hidden by admin
  order: number; // For ordering
  lastUpdatedBy?: string; // Track who updated it
  lastUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default services that must always exist
 */
export const DEFAULT_SERVICES = [
  {
    id: 'service_air_freight',
    slug: 'air-freight',
    title: 'Air Freight',
    description: 'Fast and reliable air freight services for urgent shipments. Ideal for time-sensitive goods with worldwide coverage.',
    price: 150,
    icon: 'plane',
    isDefault: true,
    isVisible: true,
    order: 1,
  },
  {
    id: 'service_shipping',
    slug: 'shipping',
    title: 'Shipping',
    description: 'Cost-effective sea and land shipping solutions for bulk cargo. Economical for large volume shipments.',
    price: 75,
    icon: 'ship',
    isDefault: true,
    isVisible: true,
    order: 2,
  },
  {
    id: 'service_cold_storage',
    slug: 'cold-storage',
    title: 'Cold Storage',
    description: 'Temperature-controlled warehousing for perishable goods. Maintains optimal conditions for fresh and frozen products.',
    price: 120,
    icon: 'snowflake',
    isDefault: true,
    isVisible: true,
    order: 3,
  },
  {
    id: 'service_customs_clearance',
    slug: 'customs-clearance',
    title: 'Customs Clearance',
    description: 'Expert customs clearance and compliance services. Ensures smooth border crossing and regulatory compliance.',
    price: 200,
    icon: 'checkCircle',
    isDefault: true,
    isVisible: true,
    order: 4,
  },
];

/**
 * Default FAQs that must always exist
 */
export const DEFAULT_FAQS = [
  {
    id: 'faq_services',
    slug: 'logistics-services',
    question: 'What logistics services does Crownshift Logistics provide?',
    answer: 'Crownshift Logistics provides comprehensive logistics solutions including air freight, sea/land shipping, cold storage for perishable goods, and customs clearance services. Each service is designed to meet different shipping needs and budgets.',
    isDefault: true,
    isVisible: true,
    order: 1,
  },
  {
    id: 'faq_customs',
    slug: 'customs-compliance',
    question: 'How do you handle customs clearance and compliance?',
    answer: 'Our expert team manages all aspects of customs clearance including documentation, tariff classification, duty calculations, and regulatory compliance. We stay updated with international trade regulations to ensure smooth border crossings for your shipments.',
    isDefault: true,
    isVisible: true,
    order: 2,
  },
  {
    id: 'faq_cold_storage',
    slug: 'cold-storage-perishables',
    question: 'Do you offer cold storage for perishable goods?',
    answer: 'Yes, we offer temperature-controlled warehouse facilities specifically designed for perishable goods. Our cold storage maintains optimal temperatures for fresh produce, frozen foods, pharmaceuticals, and other temperature-sensitive products.',
    isDefault: true,
    isVisible: true,
    order: 3,
  },
  {
    id: 'faq_tracking',
    slug: 'shipment-tracking',
    question: 'How can I track my shipment?',
    answer: 'You can track your shipment in real-time using our tracking system. Once your shipment is dispatched, you will receive a tracking number. Visit our tracking page or contact our customer service team for detailed tracking information.',
    isDefault: true,
    isVisible: true,
    order: 4,
  },
  {
    id: 'faq_regions',
    slug: 'operating-regions',
    question: 'What regions do you operate in?',
    answer: 'Crownshift Logistics operates globally with a strong presence in East Africa, Middle East, and expanding to other regions. We handle shipments to and from major international destinations. Contact us to confirm coverage for your specific route.',
    isDefault: true,
    isVisible: true,
    order: 5,
  },
];

/**
 * Helper to check if a service is deletable
 */
export function isServiceDeletable(serviceId: string): boolean {
  return !DEFAULT_SERVICES.some(s => s.id === serviceId);
}

/**
 * Helper to check if an FAQ is deletable
 */
export function isFAQDeletable(faqId: string): boolean {
  return !DEFAULT_FAQS.some(f => f.id === faqId);
}

/**
 * Helper to check if a service is default
 */
export function isDefaultService(serviceId: string): boolean {
  return DEFAULT_SERVICES.some(s => s.id === serviceId);
}

/**
 * Helper to check if an FAQ is default
 */
export function isDefaultFAQ(faqId: string): boolean {
  return DEFAULT_FAQS.some(f => f.id === faqId);
}

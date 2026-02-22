/**
 * Offer utilities - pure functions to filter active offers from services
 * Treats offers as "services with discounts" not a separate entity
 */

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  isFeatured?: boolean;
  discountPercentage?: number;
  discountEndsAt?: Date | string;
}

export interface Offer extends Service {
  discountPercentage: number;
  discountEndsAt: Date | string;
  originalPrice: number;
  discountAmount: number;
}

/**
 * Filter services that have active discounts
 * @param services Array of services to filter
 * @returns Array of offers (services with discounts)
 */
export function getActiveOffers(services: Service[]): Offer[] {
  const now = new Date();
  
  return services
    .filter((service) => {
      if (!service.discountPercentage || service.discountPercentage <= 0) {
        return false;
      }
      
      if (service.discountEndsAt) {
        const endDate = new Date(service.discountEndsAt);
        if (endDate < now) {
          return false;
        }
      }
      
      return true;
    })
    .map((service) => ({
      ...service,
      discountPercentage: service.discountPercentage!,
      discountEndsAt: service.discountEndsAt!,
      originalPrice: service.price,
      discountAmount: service.price * (service.discountPercentage! / 100),
    } as Offer));
}

/**
 * Get discounted price for a service
 */
export function getDiscountedPrice(price: number, discountPercentage: number): number {
  return price - (price * (discountPercentage / 100));
}

/**
 * Check if an offer is still active
 */
export function isOfferActive(offer: Service): boolean {
  if (!offer.discountPercentage || offer.discountPercentage <= 0) {
    return false;
  }
  
  if (offer.discountEndsAt) {
    return new Date(offer.discountEndsAt) > new Date();
  }
  
  return true;
}

/**
 * Format discount badge text
 */
export function formatDiscountBadge(discountPercentage: number): string {
  return `${discountPercentage}% OFF`;
}

/**
 * Format discount end date for display
 */
export function formatOfferExpiry(endDate: Date | string): string {
  const date = new Date(endDate);
  const now = new Date();
  const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 0) return 'Expired';
  if (daysLeft === 1) return 'Expires tomorrow';
  if (daysLeft <= 7) return `${daysLeft} days left`;
  
  return `Expires ${date.toLocaleDateString()}`;
}

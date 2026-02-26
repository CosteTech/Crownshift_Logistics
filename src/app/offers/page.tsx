import { getActiveOffers as computeActiveOffers } from '@/lib/client/offers';
import { generatePageMetadata } from '@/lib/seo-metadata';
import { apiFetchJson } from '@/lib/server/internal-api';

export const metadata = generatePageMetadata('Offers', 'Current offers and discounts', '/offers');
export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  try {
    const response = await apiFetchJson<{ success?: boolean; data?: any[]; error?: string }>(
      '/api/services/public'
    );
    const services = response.ok ? response.data?.data || [] : [];
    const offers = computeActiveOffers(services || []);

    return (
      <section className="py-16 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Offers</h1>
        <ul className="space-y-4">
          {offers.map((o: any) => (
            <li key={o.id} className="p-4 border rounded">
              <h2 className="font-semibold">{o.description || 'Special Offer'}</h2>
              <p className="text-sm text-muted-foreground">Discount: {o.discountPercent}%</p>
            </li>
          ))}
        </ul>
      </section>
    );
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Offers error:', err);
    return (
      <section className="py-16 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Offers</h1>
        <p className="text-muted-foreground">No offers available at the moment.</p>
      </section>
    );
  }
}

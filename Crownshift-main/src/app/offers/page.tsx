import { getActiveOffers } from '@/app/actions';
import { generatePageMetadata } from '@/lib/seo-metadata';

export const metadata = generatePageMetadata('Offers', 'Current offers and discounts', '/offers');

export default async function OffersPage() {
  try {
    const res = await getActiveOffers();
    if (!res.success) throw new Error(res.error || 'Failed to fetch offers');
    const offers = res.data || [];

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
    console.error('Offers error:', err);
    return (
      <section className="py-16 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Offers</h1>
        <p className="text-muted-foreground">No offers available at the moment.</p>
      </section>
    );
  }
}

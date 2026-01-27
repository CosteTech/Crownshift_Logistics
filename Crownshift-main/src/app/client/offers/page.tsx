import { OffersCarousel } from '@/components/offers-carousel';
import AuthGuard from '@/components/AuthGuard';

export default function OffersPage() {
  return (
    <AuthGuard>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Special Offers</h1>
        <OffersCarousel />
      </div>
    </AuthGuard>
  );
}

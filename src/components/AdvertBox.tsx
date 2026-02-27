'use client';

interface OfferSummary {
  id: string;
  description?: string;
  discountPercent?: number;
  isActive?: boolean;
}

interface AdvertBoxProps {
  offers: OfferSummary[];
  isLoading?: boolean;
}

export default function AdvertBox({ offers, isLoading = false }: AdvertBoxProps) {
  if (isLoading) {
    return (
      <div className="w-full rounded-xl border bg-gradient-to-r from-slate-100 to-slate-200 p-5 animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-300" />
        <div className="mt-3 h-4 w-72 rounded bg-slate-300" />
      </div>
    );
  }

  const topOffer = offers.find((offer) => offer.isActive !== false);

  if (!topOffer) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-700">Advert Box</p>
        <p className="mt-1 text-slate-600">No active offers right now. Check back soon for special discounts.</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-orange-300 bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Advert Box</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">
        {topOffer.description || 'Limited-time offer'}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        Save {topOffer.discountPercent ?? 0}% on selected logistics services.
      </p>
    </div>
  );
}


import React from "react";

export default function OfferBanner({ offer }: { offer?: { active?: boolean; title?: string; discount?: number } }) {
  if (!offer || !offer.active) return null;

  return (
    <div className="bg-blue-600 text-white py-3 text-center">
      <span className="font-medium">🔥 {offer.title} — {offer.discount}% OFF</span>
      <a href="/offers" className="ml-4 underline">
        View Offer
      </a>
    </div>
  );
}

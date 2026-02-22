import React from 'react';

interface Promo {
  serviceName: string;
  discount: number;
  validUntil: string; // e.g., '2026-02-28'
}

interface PromoBannerProps {
  promos: Promo[];
}

const PromoBanner: React.FC<PromoBannerProps> = ({ promos }) => {
  if (!promos || promos.length === 0) return null;

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-md mb-6 flex flex-col md:flex-row items-center justify-between">
      {promos.map((promo, idx) => (
        <div key={idx} className="mb-2 md:mb-0 md:mr-4">
          <strong>{promo.serviceName}</strong> -{" "}
          <span>{promo.discount}% off</span> until {promo.validUntil}
        </div>
      ))}
      <a
        href="/offers"
        className="bg-yellow-800 text-white px-3 py-1 rounded hover:bg-yellow-900 transition"
      >
        View Offer
      </a>
    </div>
  );
};

export default PromoBanner;

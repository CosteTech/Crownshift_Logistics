export const dynamic = 'force-dynamic';

import HeroSection from "@/components/sections/hero";
import QuoteGeneratorSection from "@/components/sections/quote-generator";
import { OffersCarousel } from "@/components/offers-carousel";

export default function Home() {
  return (
    <>
      <HeroSection />
      <OffersCarousel />
      <QuoteGeneratorSection />
    </>
  );
}

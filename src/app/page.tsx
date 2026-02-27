import { Metadata } from "next";
import HeroSection from "@/components/sections/hero";
import QuoteGeneratorSection from "@/components/sections/quote-generator";
import { OffersCarousel } from "@/components/offers-carousel";
import { generatePageMetadata } from "@/lib/seo-metadata";
import { ROUTE_METADATA } from "@/lib/seo-config";

export const metadata: Metadata = generatePageMetadata(
  ROUTE_METADATA.home.title,
  ROUTE_METADATA.home.description,
  "/",
  ROUTE_METADATA.home.keywords
);

export default function Home() {
  return (
    <>
      <HeroSection />
      <OffersCarousel />
      <QuoteGeneratorSection />
    </>
  );
}

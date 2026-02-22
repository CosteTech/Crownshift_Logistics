import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function HeroSection() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-white">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
          Your Partner in Global Logistics
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
          Delivering excellence, one shipment at a time. Fast, reliable, and secure solutions for all your logistics needs.
        </p>
        <div className="mt-8">
          <Link href="/#quote">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-7 px-10">
              Get an Instant Quote
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

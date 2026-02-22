import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const testimonials = [
  {
    name: 'Jane Doe',
    company: 'Innovate Inc.',
    quote: 'Crownshift Logistics transformed our supply chain. Their efficiency and real-time tracking are second to none. Highly recommended for any business looking to scale.',
    profileImageId: 'testimonial-profile-1',
  },
  {
    name: 'John Smith',
    company: 'Tech Solutions Ltd.',
    quote: 'The instant quote feature is a game-changer. We can now budget our shipping costs with incredible accuracy. Their customer service is also outstanding.',
    profileImageId: 'testimonial-profile-2',
  },
  {
    name: 'Emily Jones',
    company: 'Global Goods',
    quote: 'As an international shipper, customs can be a nightmare. Crownshift\'s brokerage services are seamless, saving us time and money on every shipment.',
    profileImageId: 'testimonial-profile-3',
  },
];

export default function TestimonialsSection() {
    const bgImage = PlaceHolderImages.find(img => img.id === 'testimonials-bg');

    return (
    <section id="testimonials" className="relative py-16 md:py-24 bg-secondary">
       {bgImage && (
            <Image
                src={bgImage.imageUrl}
                alt={bgImage.description}
                fill
                className="object-cover opacity-10"
                data-ai-hint={bgImage.imageHint}
            />
       )}
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">What Our Clients Say</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Stories of success and satisfaction from our partners.
          </p>
        </div>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-4xl mx-auto mt-12"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => {
              const profileImage = PlaceHolderImages.find(img => img.id === testimonial.profileImageId);
              return (
              <CarouselItem key={index} className="md:basis-1/2">
                <div className="p-1">
                  <Card>
                    <CardContent className="flex flex-col items-center text-center p-8">
                      {profileImage && (
                        <Image
                          src={profileImage.imageUrl}
                          alt={`Profile of ${testimonial.name}`}
                          width={80}
                          height={80}
                          className="rounded-full mb-4"
                          data-ai-hint={profileImage.imageHint}
                        />
                      )}
                      <p className="italic text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                      <p className="mt-4 font-bold font-headline">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            )})}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}

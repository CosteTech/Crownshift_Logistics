import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Ship, Warehouse, ShieldCheck, Lightbulb, Package } from 'lucide-react';

const services = [
  {
    icon: Truck,
    title: 'Domestic Shipping',
    description: 'Fast and reliable ground shipping across the country for packages of all sizes.',
  },
  {
    icon: Ship,
    title: 'International Freight',
    description: 'Seamless air and ocean freight solutions to connect your business globally.',
  },
  {
    icon: Warehouse,
    title: 'Warehousing & Storage',
    description: 'Secure, scalable warehousing and distribution services to manage your inventory.',
  },
  {
    icon: Package,
    title: 'E-commerce Fulfillment',
    description: 'End-to-end fulfillment services to help your online business scale and succeed.',
  },
  {
    icon: ShieldCheck,
    title: 'Customs Brokerage',
    description: 'Expert customs clearance to navigate complex regulations and avoid delays.',
  },
  {
    icon: Lightbulb,
    title: 'Logistics Consulting',
    description: 'Strategic advice to optimize your supply chain for efficiency and cost-savings.',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Services</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            A complete suite of logistics solutions to meet your needs.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title} className="flex flex-col text-center items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <service.icon className="h-8 w-8" />
                </div>
                <CardTitle className="font-headline mt-4">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

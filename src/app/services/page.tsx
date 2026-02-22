import Link from 'next/link';
import { getVisibleServices } from '@/lib/seed';
import { generatePageMetadata } from '@/lib/seo-metadata';

export const metadata = generatePageMetadata('Services', 'Our logistics services', '/services');

export default async function ServicesPage() {
  try {
    const services = await getVisibleServices();

    return (
      <section className="py-16 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Services</h1>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s: any) => {
            const slug = s.slug || s.id;
            return (
              <li key={s.id} className="p-4 border rounded">
                <h2 className="font-semibold text-lg">
                  <Link href={`/services/${slug}`}>{s.title || s.name || slug}</Link>
                </h2>
                <p className="text-muted-foreground mt-2">{s.description}</p>
              </li>
            );
          })}
        </ul>
      </section>
    );
  } catch (err) {
    console.error('ServicesPage error:', err);
    return (
      <section className="py-16 container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Services</h1>
        <p className="text-muted-foreground">Unable to load services right now. Please try again later.</p>
      </section>
    );
  }
}

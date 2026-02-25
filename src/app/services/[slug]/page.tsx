import { notFound } from 'next/navigation';
import { getVisibleServices } from '@/lib/seed';
import { generatePageMetadata } from '@/lib/seo-metadata';

type Params = { slug: string };

async function findService(slug: string) {
  const services = await getVisibleServices();
  return services.find((s: any) => (s.slug || s.id) === slug) || null;
}

export async function generateStaticParams() {
  try {
    const services = await getVisibleServices();
    return services.map((s: any) => ({ slug: s.slug || s.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const service = await findService(params.slug);
  if (!service) {
    return generatePageMetadata('Service', 'Service details', `/services/${params.slug}`);
  }

  return generatePageMetadata(
    service.title || 'Service',
    service.description || '',
    `/services/${params.slug}`
  );
}

export default async function ServiceDetail({ params }: { params: Params }) {
  try {
    const service = await findService(params.slug);
    if (!service) {
      notFound();
    }

    return (
      <section className="container py-16">
        <h1 className="text-3xl font-bold">{service.title}</h1>
        <p className="mt-4 text-muted-foreground">{service.description}</p>
      </section>
    );
  } catch (err) {
    console.error('ServiceDetail error:', err);
    return <div className="container py-16">Unable to load service.</div>;
  }
}

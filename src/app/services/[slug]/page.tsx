import { notFound } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo-metadata';
import { apiFetchJson } from '@/lib/server/internal-api';

type Params = { slug: string };
export const dynamic = 'force-dynamic';

async function getVisibleServices() {
  const response = await apiFetchJson<{ success?: boolean; data?: any[]; error?: string }>(
    '/api/services/public'
  );
  return response.ok ? response.data?.data || [] : [];
}

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

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const service = await findService(resolved.slug);
  if (!service) {
    return generatePageMetadata('Service', 'Service details', `/services/${resolved.slug}`);
  }

  return generatePageMetadata(
    service.title || 'Service',
    service.description || '',
    `/services/${resolved.slug}`
  );
}

export default async function ServiceDetail({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  try {
    const service = await findService(resolved.slug);
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
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('ServiceDetail error:', err);
    return <div className="container py-16">Unable to load service.</div>;
  }
}

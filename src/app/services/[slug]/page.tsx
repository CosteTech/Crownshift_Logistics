import { generatePageMetadata } from '@/lib/seo-metadata';
import { getServices } from '@/app/actions';

export async function generateStaticParams() {
  try {
    const res = await getServices();
    if (!res.success) return [];
    return (res.data || []).map((s: any) => ({ slug: s.slug || s.id }));
  } catch {
    return [];
  }
}

export default async function ServiceDetail({ params }: { params: { slug: string } }) {
  try {
    const res = await getServices();
    if (!res.success) throw new Error(res.error || 'Failed to fetch');
    const services = res.data || [];
    const service = services.find((s: any) => (s.slug || s.id) === params.slug);
    if (!service) {
      return (
        <div className="container py-16">Service not found.</div>
      );
    }

    const metadata = generatePageMetadata(service.title || 'Service', service.description || '', `/services/${params.slug}`);
    // @ts-ignore
    ServiceDetail.metadata = metadata;

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
